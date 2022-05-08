import { PlexusStateInstance, state, Watchable } from ".."
import { WatchableValue } from "./../watchable"
import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"
import { StateInstance } from "../state"
import { PlexusCollectionInstance } from "./collection"
import { isEqual } from "../helpers"
interface PlexusDataStore<DataType extends Record<string, any>> {
	_key: string | number
	primaryKey: string
	_state: StateInstance<DataType>
	_wDestroyers: Set<() => void>
}

export type PlexusDataInstance<DataType extends Record<string, any> = Record<string, any>> = CollectionDataInstance<DataType>
export type DataKey = string | number

type DataObjectType<PK extends string = "id"> = Record<string, any> & { [Key in PK]: DataKey }
export class CollectionDataInstance<DataType extends DataObjectType<PK> = any, PK extends string = string> extends Watchable<DataType> {
	private instance: () => PlexusInstance
	primaryKey: PK
	private _internalStore: PlexusDataStore<DataType>
	constructor(instance: () => PlexusInstance, public collection: () => PlexusCollectionInstance<DataType>, primaryKey: PK, value: DataType) {
		super(instance, value)
		this.instance = instance
		this.primaryKey = primaryKey
		this._internalStore = {
			_key: value[primaryKey],
			primaryKey,
			_state: state<DataType>(value).key(`collection_data_${collection().id}_${value[primaryKey]}`),
			_wDestroyers: new Set<() => void>(),
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
	set(value: Partial<DataType>, config: { mode: "replace" | "patch" } = { mode: "replace" }) {
		const checkIfHasKey = () => {
			const v = value[this._internalStore.primaryKey as PK]
			// Check if the value has the primary key, and verify the key is the same as the data instance
			const valid =
				value[this._internalStore.primaryKey] !== undefined &&
				value[this._internalStore.primaryKey as PK].toString() === this._internalStore._key.toString()
			this.instance().runtime.log(
				"warn",
				`The new data value ${valid ? "WILL" : "WILL NOT"} be set in "${config.mode}" mode...`,
				this._internalStore._key,
				value[this._internalStore.primaryKey] === this._internalStore._key
			)
			return valid
		}
		// maybe this check should be done inside of the state?
		if (!isEqual(value as DataType, this.value)) {
			if (config.mode === "replace") {
				if (checkIfHasKey()) {
					this._internalStore._state.set(value as DataType)
				}
			} else {
				if (checkIfHasKey()) {
					this._internalStore._state.patch(value as DataType)
				}
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
		// this.instance().runtime.removeWatchers("state", this._internalStore._state.name)
		this.collection().delete(this._internalStore._key)

		// delete _internalStore._state
	}
	/**
	 * Clean this data instance (remove all watchers & remove the state from the instance)
	 */
	clean() {
		this._internalStore._wDestroyers.forEach((destroyer) => destroyer())
		this._internalStore._wDestroyers.clear()
		this.instance()._states.delete(this._internalStore._state)
	}
	/**
	 * Watch for changes on this data instance
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<DataType>) {
		const destroyer = this._internalStore._state.watch(callback)
		return destroyer
	}
}

export function _data<DataType extends Record<string, any>>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<DataType>,
	primaryKey: string,
	value: DataType,
	config: { prov: boolean } = { prov: false }
) {
	// const _internalStore = {
	// 	_key: value[primaryKey],
	// 	primaryKey,
	// 	_state: state<Value>(value).key(`collection_data_${value[primaryKey]}`),
	// }

	if ((value[primaryKey] !== undefined && value[primaryKey] !== null) || config.prov) {
		return new CollectionDataInstance(instance, collection, primaryKey, value)
	}
	return null
}
