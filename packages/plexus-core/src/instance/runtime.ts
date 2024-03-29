import { Scheduler } from '../scheduler/scheduler'
import { PlexusValidStateTypes } from '../types'
import { EventEngine } from './engine'
import { PlexusInstance } from './instance'

export type PlexusRuntime = RuntimeInstance
interface RuntimeConfig {
	logLevel: 'debug' | 'warn' | 'error' | 'silent'
	name: string
}
type SubscribeFn<Value> = (value: Value, from?: string) => void
type ListenerFn<Value> = (key: string, value: Value, from?: string) => void

type LogLevels = Exclude<RuntimeConfig['logLevel'], 'silent'> | 'info'
type SubscriptionTypes =
	| 'state'
	| ' collection'
	| 'event'
	| 'storage'
	| `plugin_${string}`
	| '*'

export class RuntimeInstance {
	private instance: () => PlexusInstance
	private _engine: EventEngine
	private initializing = false
	private initsCompleted = 0
	private batching: boolean = false
	// private batchPromise: Promise<any> | null = null
	private batchesInProgress: number = 0
	batchedCalls: Array<() => any> = []

	schedule: Scheduler

	constructor(
		instance: () => PlexusInstance,
		protected config: Partial<RuntimeConfig> = {}
	) {
		this.instance = instance
		this._engine = new EventEngine(this.instance)
		this.schedule = new Scheduler(`${config.name}_runtime`)
	}
	/**
	 * track a change and propagate to all listening children in instance
	 *
	 * */
	broadcast<Value = PlexusValidStateTypes>(key: string, value: Value) {
		this.log('debug', `Broadcasting a change to ${key}`)
		if (this.batching) {
			this.batchedCalls.push(() => this.engine.emit(key, { key, value }))
			return
		}
		this.engine.emit(key, { key, value })
	}
	/**
	 * Subscribe to a change in the runtime
	 * @param _key The key of the object being watched
	 * @param _callback The function to call when the value changes
	 * @returns A function to remove the watcher
	 */
	subscribe<Value = PlexusValidStateTypes>(
		_key: string,
		_callback: SubscribeFn<Value>,
		from?: string
	) {
		this.log('debug', `Subscribing to changes of ${_key}`)
		const callback = (data: { key: string; value: Value }) => {
			const { key, value } = data
			this.log('debug', `${_key} has been changed to: `, value)
			if (_key === key) {
				_callback?.(value, from)
			}
		}

		const unsub = this.engine.on(_key, callback, from)

		// return the watcher unsubscribe function
		return () => {
			unsub()
		}
	}
	/**
	 * Listen for all events on the runtime
	 * @param _callback The function to call when the value changes
	 * @returns A function to remove the watcher
	 */
	listen<Value = PlexusValidStateTypes>(
		_callback: ListenerFn<Value>,
		from?: string
	) {
		this.log('debug', `${from || 'Unknown'} Listening to all runtime events`)
		const callback = (data: { key: string; value: Value }) => {
			const { key, value } = data
			_callback?.(key, value, from)
		}

		const unsub = this.engine.onAny(callback, from)

		// return the watcher unsubscribe function
		return () => {
			unsub()
		}
	}

	/**
	 * Either get all watchers on this runtime or get the specific watchers on an event
	 * @param key (optional) The event key
	 */
	getWatchers(key?: string) {
		return key && this.engine.events.has(`${key}`)
			? this.engine.events.get(`${key}`)
			: {}
	}
	/**
	 * remove a watcher from the runtime given a type and a key
	 * @param type The type of watcher to remove
	 * @param key The key of the watcher to remove
	 */
	removeWatchers(type: SubscriptionTypes, key: string) {
		this.engine.events.get(key)
	}
	/**
	 * Runtime logger function
	 * @param type The type of log message
	 * @param message The message to send
	 */
	log(type: LogLevels, ...message: any[]) {
		const typeColors = {
			info: '#4281A4',
			warn: '#E9D985',
			error: '#CE2D4F',
		}
		const callLog = () =>
			console[type](
				`%cPlexus(%c${this.instance().name}%c) ${type.toUpperCase()}:%c`,
				`color: ${typeColors[type] || '#4281A4'};`,
				'color: #D8DC6A;',
				`color: ${typeColors[type] || '#4281A4'};`,
				'color: unset;',
				...message
			)

		if (this.instance().settings.logLevel) {
			switch (this.instance().settings.logLevel) {
				case 'warn': {
					if (type === 'error' || type === 'warn') callLog()
					break
				}
				case 'error': {
					type === 'error' && callLog()
					break
				}
				case 'silent': {
					return
				}
				case 'debug': {
					callLog()
					break
				}
			}
			return
		}

		// comment or uncomment to allow or disallow dev logging (always on)
		// callLog()
	}
	/**
	 * Runtime Conductor Engine
	 */
	get engine() {
		return this._engine
	}

	/**
	 * You can use either the callback, or the promise to know when the instance runtime is ready
	 * @param callback
	 * @returns Promise that resolves when the runtime is ready
	 */
	runInit(callback?: (...args: any[]) => any) {
		return new Promise<void>((resolve, reject) => {
			const inits = Array.from(this.instance()._inits.values())
			// if we already initialized, don't do it again
			if (this.instance().ready) {
				return
			}
			// if we are already initializing, wait for it to finish
			if (this.initializing) {
				return
			}

			// set the initializing flag
			this.initializing = true
			this.log('info', 'Initializing Instance...')
			const size = inits.length
			// create an array of init action instances, and run them in parallel
			const runners = inits.map((init) =>
				init.complete ? async () => {} : init.run()
			)

			// wait for all inits to complete in parallel
			Promise.allSettled(runners).then(() => {
				// set the ready flag
				this.instance().ready = true
				// reset the initializing flag
				this.initializing = false
				// run the callback if there is one
				callback?.()
				//set the number of initsCompleted
				this.initsCompleted = size

				// resolve the promise
				resolve()
			})
		})
	}

	/**
	 *	The batch function allows you to run a series of reactive actions in a single transaction.
	 * If there is already a batch in progress, the function will be added to the batch and run when the batch is released.
	 * @param {Function} fn The function to run
	 */
	batch<BatchFunction extends () => any | Promise<any>>(
		fn: BatchFunction
	): ReturnType<BatchFunction> | null {
		if (!fn) {
			throw new Error('You must provide a function to run in the batch')
		}
		// if we are already batching, add the function to the array and return
		if (this.batching) {
			this.log(
				'debug',
				'Already batching something, adding a function to the list of batched things...'
			)
			// ++this.batchesInProgress
			this.batchedCalls.push(() => fn())
			return null
		}

		const release = this.startBatching()

		// run the function. If it returns a promise, wait for it to resolve
		const pendingResponse = fn()
		if (pendingResponse instanceof Promise) {
			return new Promise<ReturnType<BatchFunction>>(async (resolve, reject) => {
				// wait for the promise to resolve
				const value = await pendingResponse
				// release the batch
				release()
				// resolve the promise, return the value of the promise
				return resolve(value)
			}) as ReturnType<BatchFunction>
		}
		release()
		return pendingResponse
	}

	/**
	 * The batching flag
	 * @returns {boolean} true if the runtime is batching
	 */
	get isBatching() {
		return this.batching
	}

	/**
	 *	Release the batch
	 * @returns {void}
	 */
	private endBatching() {
		// if we aren't batching anymore, just return
		if (this.batching === false) {
			return
		}
		// decrement the number of batches in progress
		--this.batchesInProgress
		// if there are still batches in progress, just return
		if (this.batchesInProgress > 0) {
			this.log(
				'debug',
				`Aborting batch end because ${this.batchesInProgress} batches are still in progress`
			)
			return
		}
		this.engine.halt()
		this.log(
			'debug',
			`Executing batch (${this.batchedCalls.length} calls)`,
			this.batchedCalls
		)
		// call all the pending functions and clear the array
		this.batching = false
		while (this.batchedCalls.length > 0) {
			const pendingFn = this.batchedCalls.shift()
			if (!pendingFn) continue
			pendingFn()
		}

		// release the reactivity engine
		this.engine.release()
		// if(this.batchesInProgress === 0) { unhalt() }
		this.log('info', 'Batch function completed!')
	}
	/**
	 * Begin batching any calls to the runtime
	 * @private
	 * @returns {Function(): void} A function to release the batch
	 */
	private startBatching() {
		this.batching = true
		++this.batchesInProgress
		// hold the reactivity engine and start storing changes
		// this.engine.halt()
		this.log('info', 'Batch function started!')
		return () => {
			this.endBatching()
		}
	}
}
/**
 * Create a runtime for an instance NOTE: NOT FOR PUBLIC USE
 * @param instance the instance the runtime is running on
 * @returns A new runtime (or the currently existing runtime) for a given instance
 * @private
 */
export function _runtime(
	instance: () => PlexusInstance,
	config?: Partial<RuntimeConfig>
) {
	return new RuntimeInstance(instance, config)
}
