import { PlexusInstance } from "."
import { deepClone, deepMerge, genUID, isObject } from "./helpers"
import { AlmostAnything } from "./interfaces"
export type PlexusWatcher<V extends any = any> = (value: V) => void
interface WatchableStore<Value = any> {
	_initialValue: Value
	_lastValue: Value | null
	_value: Value
	_publicValue: Value
	_nextValue: Value
	_watchers: Set<PlexusWatcher<Value>>
	_internalId: string
}

type HistorySeed<ValueType = any> = {
	maxLength: number
	skipArchiveUpdate: boolean
	start: ValueType
	archive_head: Array<ValueType>
	archive_tail: Array<ValueType>
}

export class Watchable<ValueType = any> {
	protected _watchableStore: WatchableStore<ValueType>
	protected instance: () => PlexusInstance
	/**
	 * The internal id of the computed state
	 */
	get id(): string {
		return `${this._watchableStore._internalId}`
	}
	constructor(instance: () => PlexusInstance, init: ValueType) {
		this.instance = instance
		this._watchableStore = {
			_internalId: instance().genId(),
			_nextValue: init,
			_value: init,
			_publicValue: init,
			_initialValue: init,
			_lastValue: null,
			_watchers: new Set(),
		}
	}

	watch<Value extends ValueType = ValueType>(callback: PlexusWatcher<ValueType>, from?: string): () => void {
		// this.instance().runtime.log("debug", `Watching Instance ${this.id}`)
		const destroyer = this.instance().runtime.subscribe(this.id, callback, from)
		this._watchableStore._watchers.add(destroyer)

		return () => {
			destroyer()
			this._watchableStore._watchers.delete(destroyer)
		}
	}
	get value(): ValueType {
		return this._watchableStore._publicValue
	}
}

export class WatchableMutable<ValueType = any> extends Watchable<ValueType> {
	private _history: HistorySeed | undefined
	constructor(instance: () => PlexusInstance, init: ValueType) {
		super(instance, init)
	}

	/**
	 * Undo the last state change.
	 * If history is enabled, we traverse the history archive.
	 * if not, we try to go to the last set value.
	 * If no previous value (either `.set()` was never called or we previously used `.undo()`), reset to initial value.
	 * @returns this
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
				this.instance().runtime.log("warn", `No history to undo for ${this.id}; setting to initial value.`)
				// this.set(this._watchableStore._initialValue)
				this.set(this._history.start)
			}

			// After using set, archive head has the last set value which is not what we want. So we pop to remove it from the archive head
			// this._history.archive_head.pop()
			this._history.skipArchiveUpdate = false
		}
		// no history, so just try to reset to last value; if null, reset to initial value
		else {
			if (this._watchableStore._lastValue !== null) {
				this.set(this._watchableStore._lastValue)
				// last value should now be the current value BEFORE the undo, so set this to next value
				this._watchableStore._nextValue = this._watchableStore._lastValue
			} else {
				this.set(this._watchableStore._initialValue)
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
	 * @returns this
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
				this.instance().runtime.log("warn", `No history to redo for ${this.id}; setting to current/next value.`)
				this.set(this._watchableStore._nextValue)
			}

			// After using set, archive head has the last set value which is not what we want. So we pop to remove it from the archive head
			// this._history.archive_head.pop()

			this._history.skipArchiveUpdate = false
		}
		// no upcoming history, so just try to reset to current/value;
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
	 * @returns this
	 */
	history(maxLength: number = 10): this {
		// disable history if maxLength is 0 (can be done at any time)
		if (maxLength <= 0) {
			this.instance().runtime.log("debug", `Disabling history for ${this.id}`)
			this._history = undefined
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
		this.instance().runtime.log("debug", `Enabling history for ${this.id}`)

		return this
	}

	/**
	 * Set the value of the state
	 * @param newValue The new value of this state
	 */
	set(newValue?: ValueType) {
		const value = deepClone(newValue)
		this._watchableStore._lastValue = this._watchableStore._value
		if (isObject(value) && isObject(this._watchableStore._value)) {
			this._watchableStore._lastValue = deepClone(this._watchableStore._value)
		} else if (Array.isArray(value) && Array.isArray(this._watchableStore._value)) {
			const obj = deepMerge(this._watchableStore._value, value)
			this._watchableStore._lastValue = Object.values(obj) as unknown as ValueType
		} else {
			this._watchableStore._lastValue = this._watchableStore._value
		}
		// apply the next value
		if (value === undefined) {
			this._watchableStore._value = this._watchableStore._nextValue
		} else {
			this._watchableStore._value = value
		}
		this._watchableStore._publicValue = deepClone(this._watchableStore._value)
		this._watchableStore._nextValue = deepClone(this._watchableStore._value)

		// update the runtime conductor

		this.instance().runtime.log("debug", `Broadcasting to Instance ${this.id}`)
		this.instance().runtime.broadcast(this.id, value)

		// if history, add to archive
		if (this._history && this._history.maxLength > 0 && !this._history.skipArchiveUpdate) {
			this.instance().runtime.log("debug", `Watchable set caused its History to shift ${this.id}`)
			this._history.archive_head.push(this._watchableStore._lastValue)
			// if we are setting a new value and the tail has any values, remove them
			// NOTE: this is needed because if we set new value, but are in the middle of the history somewhere, we need to remove the subsequent values
			if (this._history.archive_tail.length) {
				this._history.archive_tail.length = 0
			}
			// if archive is too long, remove oldest
			const archiveLength = this._history.archive_head.length + this._history.archive_tail.length
			if (archiveLength > this._history.maxLength) {
				if (this._history.archive_head.length > 0) {
					this._history.archive_head.shift()
				} else {
					this._history.archive_tail.shift()
				}
			}
		}
	}
}
