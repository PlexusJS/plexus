import { EventEngine } from "./engine"
import { isAsyncFunction } from "./helpers"
import { PlexusInstance } from "./instance"
import { PlexusStateType } from "./state"

export type PlexusRuntime = RuntimeInstance
interface RuntimeConfig {
	logLevel: "debug" | "warn" | "error" | "silent"
}
type Fn<Value> = (value: Value) => void
type LogLevels = Exclude<RuntimeConfig["logLevel"], "silent"> | "info"
type SubscriptionTypes = "state" | " collection" | "event" | "storage" | `plugin_${string}` | "*"

export class RuntimeInstance {
	private instance: () => PlexusInstance
	private _engine: EventEngine
	private initializing = false
	private initsCompleted = 0

	constructor(instance: () => PlexusInstance, protected config: Partial<RuntimeConfig> = {}) {
		this.instance = instance
		this._engine = new EventEngine()
	}
	/**
	 * track a change and propagate to all listening children in instance
	 *  */
	broadcast<Value = PlexusStateType>(key: string, value: Value) {
		this.log("info", `Broadcasting a change to ${key}`)
		this.engine.emit(key, { key, value })
	}
	/**
	 *
	 * @param _key The key of the object being watched
	 * @param _callback The function to call when the value changes
	 * @returns A function to remove the watcher
	 */
	subscribe<Value = PlexusStateType>(_key: string, _callback: Fn<Value>, from?: string) {
		this.log("info", `Subscribing to changes of ${_key}`)
		const callback = (data: { key: string; value: Value }) => {
			const { key, value } = data
			this.log("debug", `${_key} has been changed to: `, value)
			if (_key === key) {
				_callback?.(value)
			}
		}

		const unsub = this.engine.on(_key, callback, from)

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
		return key && this.engine.events.has(`${key}`) ? this.engine.events.get(`${key}`) : {}
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
			info: "#4281A4",
			warn: "#E9D985",
			error: "#CE2D4F",
		}
		const callLog = () =>
			console[type](
				`%cPlexus(%c${this.instance().name}%c) ${type.toUpperCase()}:%c`,
				`color: ${typeColors[type] || "#4281A4"};`,
				"color: #D8DC6A;",
				`color: ${typeColors[type] || "#4281A4"};`,
				"color: unset;",
				...message
			)

		if (this.instance().settings.logLevel) {
			switch (this.instance().settings.logLevel) {
				case "warn": {
					if (type === "error" || type === "warn") callLog()
					break
				}
				case "error": {
					type === "error" && callLog()
					break
				}
				case "silent": {
					return
				}
				case "debug": {
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
	 * @returns
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
			this.log("info", "Initializing Instance...")
			const size = inits.length
			// create an array of init action instances, and run them in parallel
			const runners = inits.map((init) => (init.complete ? async () => {} : init.run()))

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
}
/**
 * Create a runtime for an instance NOTE: NOT FOR PUBLIC USE
 * @param instance the instance the runtime is running on
 * @returns
 * @private
 */
export function _runtime(instance: () => PlexusInstance, config?: Partial<RuntimeConfig>) {
	return new RuntimeInstance(instance, config)
}
