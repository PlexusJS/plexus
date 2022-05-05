import { PlexusInstance } from "."
import { deepClone, deepMerge, genUID, isObject } from "./helpers"
import { AlmostAnything } from "./interfaces"
export type PlexusWatcher<V extends any = any> = (value: V) => void
interface WatchableStore<Value = any> {
	_initialValue: Value
	_lastValue: Value
	_value: Value
	_nextValue: Value
	_watchers: Set<PlexusWatcher<Value>>
	_internalId: string
}
export class Watchable<ValueType = any> {
	protected _watchableStore: WatchableStore<ValueType>
	protected _instance: () => PlexusInstance
	constructor(instance: () => PlexusInstance, init: ValueType) {
		this._instance = instance
		this._watchableStore = {
			_internalId: instance().genId(),
			_nextValue: init,
			_value: init,
			_initialValue: init,
			_lastValue: init,
			_watchers: new Set(),
		}
	}

	watch<Value extends ValueType = ValueType>(callback: PlexusWatcher<ValueType>): () => void {
		const destroyer = this._instance().runtime.subscribe(this._watchableStore._internalId, callback)
		this._watchableStore._watchers.add(destroyer)

		return () => {
			destroyer()
			this._watchableStore._watchers.delete(destroyer)
		}
	}
	get value(): ValueType {
		return deepClone(this._watchableStore._value)
	}
}

export class WatchableValue<ValueType = any> extends Watchable<ValueType> {
	constructor(instance: () => PlexusInstance, init: ValueType) {
		super(instance, init)
	}

	set(value?: ValueType) {
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
		this._watchableStore._nextValue = deepClone(this._watchableStore._value)

		// update the runtime conductor
		// this.mount()
		this._instance().runtime.broadcast(this._watchableStore._internalId, value)
	}
}
