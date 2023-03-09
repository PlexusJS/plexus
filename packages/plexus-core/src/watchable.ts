import { PlexusInstance } from '.'
import {
	deepClone,
	deepMerge,
	isObject,
	isEqual,
	AlmostAnything,
	LiteralType,
} from '@plexusjs/utils'
import { Fetcher, PlexusStateType, PlexusWatcher } from './types'

type WatchableStore<Value extends PlexusStateType = any> = {
	_initialValue: Value
	_lastValue: Value | null
	_value: Value
	_publicValue: Value
	_nextValue: Value
	_internalId: string
	_dataFetcher?: Fetcher<Value>
}

type HistorySeed<ValueType extends PlexusStateType = any> = {
	maxLength: number
	skipArchiveUpdate: boolean
	start: ValueType
	archive_head: Array<ValueType>
	archive_tail: Array<ValueType>
}

export class Watchable<ValueType extends PlexusStateType = any> {
	protected _watchableStore: WatchableStore<ValueType>
	protected instance: () => PlexusInstance
	loading: boolean = false
	/**
	 * The internal id of the computed state
	 */
	get id(): string {
		return `${this._watchableStore._internalId}`
	}
	constructor(
		instance: () => PlexusInstance,
		init: Fetcher<ValueType> | ValueType
	) {
		this.instance = instance

		const getInit = () => (typeof init === 'function' ? init() : init)

		const dataFetcher = () => {
			this.loading = true
			const value = getInit()
			this._watchableStore._publicValue = deepClone(value)
			this.loading = false
			return value
		}

		const initialValue = getInit()
		this._watchableStore = {
			_internalId: instance().genId(),
			_nextValue: initialValue,
			_value: initialValue,
			_publicValue: deepClone(initialValue),
			_initialValue: initialValue,
			_lastValue: null,
			_dataFetcher: typeof init === 'function' ? dataFetcher : undefined,
		}
		// dataFetcher()
	}

	watch(callback: PlexusWatcher<ValueType>, from?: string): () => void {
		const destroyer = this.instance().runtime.subscribe(this.id, callback, from)
		return () => {
			destroyer()
		}
	}

	get value(): ValueType {
		const value = this._watchableStore._publicValue
		if (!value && this._watchableStore._dataFetcher) {
			return this._watchableStore._dataFetcher()
		}
		return value
	}
}

export class WatchableMutable<
	ValueType extends PlexusStateType = any
> extends Watchable<ValueType> {
	private _history: HistorySeed | undefined
	constructor(
		instance: () => PlexusInstance,
		init: Fetcher<ValueType> | ValueType
	) {
		super(instance, init)
	}

	/**
	 * Set the value of the state
	 * @param newValue The new value of this state
	 * @returns {this} The state instance
	 */
	set(newValue?: ValueType) {
		if (this.instance().runtime.isBatching) {
			this.instance().runtime.batchedCalls.push(() => this.set(newValue))
			return
		}
		this.loading = true
		const value = deepClone(newValue)
		// if (!value) {
		// 	this.instance().runtime.log(
		// 		'warn',
		// 		`Watchable ${this.id} skipping set() because value is undefined or null.`
		// 	)
		// 	return this
		// }
		this._watchableStore._lastValue = this._watchableStore._value
		this._watchableStore._lastValue = deepClone(this._watchableStore._value)
		// apply the next value
		if (value === undefined) {
			this._watchableStore._value = this._watchableStore._nextValue
		} else {
			this._watchableStore._value = value
		}
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
				return
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
	}

	/**
	 * Undo the last state change.
	 * If history is enabled, we traverse the history archive.
	 * if not, we try to go to the last set value.
	 * If no previous value (either `.set()` was never called or we previously used `.undo()`), reset to initial value.
	 * @returns {this}
	 */
	undo() {
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
				this.set(this._watchableStore._lastValue as ValueType)
				// last value should now be the current value BEFORE the undo, so set this to next value
				this._watchableStore._nextValue = this._watchableStore._lastValue
			} else {
				this.set(this._watchableStore._initialValue as ValueType)
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
	redo() {
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
	defineFetcher(fetcher: Fetcher<ValueType>) {
		this._watchableStore._dataFetcher = fetcher
		return this
	}

	/**
	 * A function to fetch data from an external source and set it to the watchable.
	 * @returns {this}
	 */
	fetch(): this {
		if (this._watchableStore._dataFetcher) {
			this.set(this._watchableStore._dataFetcher())
		}
		return this
	}
}
