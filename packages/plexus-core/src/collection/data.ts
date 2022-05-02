import { PlexusStateInstance, state } from ".."
import { WatchableValue } from "./../watchable"
import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"
import { StateInstance } from "../state"
interface PlexusDataStore<ValueType extends Record<string, any>> {
	_key: string
	primaryKey: string
	_state: StateInstance<ValueType>
}

export type PlexusDataInstance<ValueType extends Record<string, any> = Record<string, any>> = CollectionDataInstance<ValueType>
export type DataKey = string | number

type DataObjectType<PK extends string = "id"> = Record<string, any> & { [Key in PK]: DataKey }
export class CollectionDataInstance<ValueType extends DataObjectType<PK> = any, PK extends string = string> {
	private instance: () => PlexusInstance
	primaryKey: PK
	private _internalStore: PlexusDataStore<ValueType>
	constructor(instance: () => PlexusInstance, primaryKey: PK, value: ValueType) {
		// super(instance, value)
		this.instance = instance
		this.primaryKey = primaryKey
		this._internalStore = {
			_key: value[primaryKey].toString(),
			primaryKey,
			_state: state<ValueType>(value).key(`collection_data_${value[primaryKey]}`),
		}
		// this.value = value
	}
	/**
	 * Get the value of the data instance
	 */
	get value() {
		return this._internalStore._state.value
	}
	/**
	 * Set the value of the data instance
	 * @param value The value to set
	 * @param config The config to use when setting the value
	 * @param config.mode should we 'patch' or 'replace' the value
	 */
	set(value: Partial<ValueType>, config: { mode: "replace" | "patch" } = { mode: "replace" }) {
		const checkIfHasKey = () => {
			const v = value[this._internalStore.primaryKey as PK]
			const valid =
				value[this._internalStore.primaryKey] !== undefined &&
				value[this._internalStore.primaryKey as PK].toString() === this._internalStore._key.toString()
			this.instance().runtime.log(
				"warn",
				`The new data value ${valid ? "WILL" : "WILL NOT"} be set in "${config.mode}" mode`,
				value,
				value[this._internalStore.primaryKey],
				this._internalStore._key,
				value[this._internalStore.primaryKey] === this._internalStore._key
			)
			return valid
		}
		if (config.mode === "replace") {
			if (checkIfHasKey()) {
				this._internalStore._state.set(value as ValueType)
			}
		} else {
			if (checkIfHasKey()) {
				this._internalStore._state.patch(value as ValueType)
			}
		}
	}
	/**
	 * The state that powers this data instance
	 */
	get state() {
		return this._internalStore._state
	}
	/**
	 * Delete the data instance
	 */
	delete() {
		this.instance().runtime.removeWatchers("state", this._internalStore._state.name)
		this.instance()._states.delete(this._internalStore._state)
		// delete _internalStore._state
	}
	/**
	 * Watch for changes on this data instance
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<ValueType>) {
		return this._internalStore._state.watch(callback)
	}
}

export function _data<ValueType extends Record<string, any>>(
	instance: () => PlexusInstance,
	primaryKey: string,
	value: ValueType
): PlexusDataInstance<ValueType> | null {
	// const _internalStore = {
	// 	_key: value[primaryKey],
	// 	primaryKey,
	// 	_state: state<Value>(value).key(`collection_data_${value[primaryKey]}`),
	// }

	if (value[primaryKey] !== undefined && value[primaryKey] !== null) {
		return new CollectionDataInstance(instance, primaryKey, value)
	}
	return null
}
