import { PlexusInstance } from './instance/instance'
import {
	deepClone,
	isEqual,
	PlexusWatchableValueInterpreter,
} from '@plexusjs/utils'
import { Fetcher, PlexusValidStateTypes, PlexusWatcher } from './types'

const getFetcher = function <ValueType>(
	subject: ValueType | (() => ValueType)
) {
	return typeof subject === 'function'
		? (subject as () => ValueType)()
		: subject
}

type WatchableStore<Value = any> = {
	_initialValue: Value
	_lastValue: Value | null
	_value: Value
	_publicValue: Value
	_nextValue: Value
	_internalId: string
	_dataFetcher?: Fetcher<Value>
}

type HistorySeed<ValueType = any> = {
	maxLength: number
	skipArchiveUpdate: boolean
	start: ValueType
	archive_head: Array<ValueType>
	archive_tail: Array<ValueType>
}

export class Watchable<
	ValueType = any
	// ValueType extends AlmostAnything = Input extends Fetcher<infer V> ? V : Input
> {
	protected _watchableStore: WatchableStore<
		PlexusWatchableValueInterpreter<ValueType>
	>
	protected instance: () => PlexusInstance
	loading: boolean = false
	/**
	 * The internal id of the computed state
	 */
	get id(): string {
		return `${this._watchableStore._internalId}`
	}
	constructor(instance: () => PlexusInstance, init: ValueType) {
		this.instance = instance

		const initialValue = getFetcher(
			init
		) as PlexusWatchableValueInterpreter<ValueType>
		this._watchableStore = {
			_internalId: instance().genId(),
			_nextValue: initialValue,
			_value: initialValue,
			_publicValue: deepClone(initialValue),
			_initialValue: initialValue,
			_lastValue: null,
			_dataFetcher: undefined,
		}
		// dataFetcher()
	}

	/**
	 * Subscribe to changes to this state
	 * @param callback The callback to run when the state changes
	 * @param {string}from The id of the something that  that triggered the change
	 * @returns {DestroyFn} A function to remove the watcher
	 */
	watch(
		callback: PlexusWatcher<PlexusWatchableValueInterpreter<ValueType>>,
		from?: string
	): () => void {
		const destroyer = this.instance().runtime.subscribe(this.id, callback, from)
		return () => {
			destroyer()
		}
	}

	/**
	 * Retrieve the current value of the state
	 */
	get value(): PlexusWatchableValueInterpreter<ValueType> {
		const value = this._watchableStore._publicValue
		if (value === undefined && this._watchableStore._dataFetcher) {
			return this._watchableStore._dataFetcher()
		}
		return value
	}

	/**
	 * Compare a thing to the current value, if they are equal, returns true
	 * @param value The thing to compare the current value to
	 * @returns {boolean} A boolean representing if they are equal
	 */
	isEqual(value: any): boolean {
		return isEqual(value as any, this._watchableStore._value as any)
	}
}

export class WatchableMutable<
	// Input = never,
	ValueType = any
> extends Watchable<ValueType> {
	private _history: HistorySeed | undefined
	// constructor(instance: () => PlexusInstance, init: () => ValueType)
	// constructor(instance: () => PlexusInstance, init: ValueType)
	constructor(instance: () => PlexusInstance, init: ValueType) {
		super(instance, init)
		// this._watchableStore._dataFetcher = () =>
		// 	getFetcher(init) as PlexusWatchableValueInterpreter<ValueType>
	}

	/**
	 * Set the value of the state
	 * @param newValue The new value of this state
	 * @returns {this} The state instance
	 */
	set(newValue?: PlexusWatchableValueInterpreter<ValueType>): this {
		if (this.instance().runtime.isBatching) {
			this.instance().runtime.batchedCalls.push(() => this.set(newValue))
			return this
		}
		this.loading = true

		const value = deepClone(newValue ?? this._watchableStore._nextValue)
		this._watchableStore._lastValue = deepClone(this._watchableStore._value)

		// apply the next value
		this._watchableStore._value =
			value === undefined ? this._watchableStore._nextValue : value

		this._watchableStore._publicValue = deepClone(this._watchableStore._value)
		this._watchableStore._nextValue = deepClone(this._watchableStore._value)

		// update the runtime conductor

		this.instance().runtime.log(
			'debug',
			`Watchable ${this.id} broadcasting to change to subscribers`
		)
		this.instance().runtime.broadcast(this.id, value)

		// if history, add to archive
		if (
			this._history &&
			this._history.maxLength > 0 &&
			!this._history.skipArchiveUpdate
		) {
			if (
				isEqual(this._watchableStore._lastValue, this._watchableStore._value)
			) {
				this.loading = false
				return this
			}
			this.instance().runtime.log(
				'debug',
				`Watchable ${this.id} set caused its History to shift`
			)
			this._history.archive_head.push(this._watchableStore._lastValue)
			// if we are setting a new value and the tail has any values, remove them
			// NOTE: this is needed because if we set new value, but are in the middle of the history somewhere, we need to remove the subsequent values
			if (this._history.archive_tail.length) {
				this._history.archive_tail.length = 0
			}
			// if archive is too long, remove oldest
			if (this._history.archive_head.length > this._history.maxLength) {
				if (this._history.archive_head.length > 0) {
					this._history.archive_head.shift()
				}
			}
		}
		this.loading = false
		return this
	}

	/**
	 * The previous (reactive) value of the state
	 */
	get lastValue() {
		return deepClone(this._watchableStore._lastValue)
	}
	/**
	 * The next value to apply to the state
	 * This is normally managed internally, but you can use it to "prepare" the state before applying the value.
	 * @example state.nextValue = { foo: "bar" };
	 * state.set(); // The state will be { foo: "bar" }
	 */
	get nextValue() {
		return this._watchableStore._nextValue
	}
	set nextValue(value: PlexusWatchableValueInterpreter<ValueType>) {
		this._watchableStore._nextValue = value
	}
	/**
	 * The initial (default) value of the state
	 */
	get initialValue() {
		return deepClone(this._watchableStore._initialValue)
	}

	/**
	 * Reset the state to the initial value
	 */
	reset() {
		this.set(this._watchableStore._initialValue)
		// disable history if enabled
		this.history(0)
		return this
	}

	/**
	 * Undo the last state change.
	 * If history is enabled, we traverse the history archive.
	 * if not, we try to go to the last set value.
	 * If no previous value (either `.set()` was never called or we previously used `.undo()`), reset to initial value.
	 * @returns {this}
	 */
	undo(): this {
		if (this._history && this._history.maxLength > 0) {
			this._history.skipArchiveUpdate = true
			// if we have any previous history, undo the last set value
			if (this._history.archive_head.length > 0) {
				const currentValue = this.value
				const newValue = this._history.archive_head.pop()
				this.set(newValue)
				this._history.archive_tail.unshift(currentValue)
			} else {
				this.instance().runtime.log('warn', `No history to undo for ${this.id}`)
			}

			this._history.skipArchiveUpdate = false
		}
		// no history, so just try to reset to last value; if null, reset to initial value
		else {
			if (this._watchableStore._lastValue !== null) {
				this.set(
					this._watchableStore
						._lastValue as PlexusWatchableValueInterpreter<ValueType>
				)
				// last value should now be the current value BEFORE the undo, so set this to next value
				this._watchableStore._nextValue = this._watchableStore._lastValue
			} else {
				this.set(
					this._watchableStore
						._initialValue as PlexusWatchableValueInterpreter<ValueType>
				)
			}
			this._watchableStore._lastValue = null
		}
		return this
	}
	/**
	 * Redo the last state change.
	 * If history is enabled, we traverse the history archive.
	 * If not, we try to go to the next set value.
	 * If no next value (`.undo()` was never called), reset to current value.
	 * @returns {this}
	 */
	redo(): this {
		if (this._history && this._history.maxLength > 0) {
			this._history.skipArchiveUpdate = true
			//  if we hae any upcoming history, redo the next set value
			if (this._history.archive_tail.length > 0) {
				const currentValue = this.value
				const newValue = this._history.archive_tail.shift()
				this.set(newValue)
				this._history.archive_head.push(currentValue)
			} else {
				this.instance().runtime.log('warn', `No history to redo for ${this.id}`)
				// this.set(this._watchableStore._nextValue)
			}

			this._history.skipArchiveUpdate = false
		}
		// no upcoming history, so just try to reset to current/next value;
		else {
			this.set()
		}

		return this
	}
	get canUndo(): boolean {
		return this._history ? this._history.archive_head.length > 0 : false
	}
	get canRedo(): boolean {
		return this._history ? this._history.archive_tail.length > 0 : false
	}

	/**
	 * Enable/Disable history tracker for this watchable by setting the history length.
	 * @param maxLength - the maximum number of history states to keep. If 0, history is disabled. If undefined, history is enabled with a default length of 10
	 * @returns {this}
	 */
	history(maxLength: number = 10): this {
		// disable history if maxLength is 0 (can be done at any time)
		if (maxLength <= 0) {
			this.instance().runtime.log('debug', `History disabled for ${this.id}`)
			delete this._history
			return this
		}
		// enable history if maxLength is > 0 (can be done at any time)
		this._history = {
			start: deepClone(this.value),
			archive_head: [],
			archive_tail: [],
			maxLength,
			skipArchiveUpdate: false,
		}
		this.instance().runtime.log('debug', `History enabled for ${this.id}`)

		return this
	}

	/**
	 * A function to fetch data from an external source and set it to the watchable.
	 * @param fetcher - a function to fetch data from an external source (must match initial type)
	 * @returns {this}
	 */
	defineFetcher(
		fetcher: Fetcher<PlexusWatchableValueInterpreter<ValueType>>
	): this {
		this._watchableStore._dataFetcher = fetcher
		return this
	}

	/**
	 * A function to fetch data from an external source and set it to the watchable.
	 * @returns {this}
	 */
	fetch(): this {
		if (this._watchableStore._dataFetcher) {
			this.loading = true
			this.set(this._watchableStore._dataFetcher())
			this.loading = false
		}
		return this
	}
}
