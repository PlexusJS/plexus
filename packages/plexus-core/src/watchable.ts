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
	archive_front: Array<ValueType>
	archive_back: Array<ValueType>
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
	 * Undo the last state change. If history is enabled, we traverse the history archive. if not, we try to go to the last set value. If no previous value (either `.set()` was never called or we previously used `.undo()`), reset to initial value
	 */
	undo() {
		if (this._history) {
			
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
	 * Redo the last state change. If history is enabled, we traverse the history archive. if not, we try to go to the next set value. If no previous value (either `.set()` was never called or we previously used `.redo()`), reset to initial value
	 * @returns
	 */
	redo() {
		if (this._history) {
		}
		return this
	}

	history(maxLength: number = 20): this {
		this._history = {
			maxLength,
			archive_front: [],
			archive_back: [],
		}

		return this
	}

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
		if (this._history) {
			// if archive is too long, remove oldest
			const archiveLength = this._history.archive_front.length + this._history.archive_back.length
			if (archiveLength > this._history.maxLength) {
				if (this._history.archive_front.length > 0) {
					this._history.archive_front.shift()
				} else {
					this._history.archive_back.shift()
				}
			}
		}
	}
}
