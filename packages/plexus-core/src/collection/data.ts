import { state } from ".."
import { WatchableMutable } from "./../watchable"
import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"
import { StateInstance } from "../state"
import { PlexusCollectionInstance } from "./collection"
import { deepClone, deepMerge, isEqual, isObject } from "../helpers"

interface CollectionDataConfig {
	prov: boolean
	unfoundKeyIsUndefined?: boolean
}
interface PlexusDataStore<DataType extends Record<string, any>> {
	_key: string | number
	primaryKey: string
	_wDestroyers: Set<() => void>
	_config: CollectionDataConfig
}

export type PlexusDataInstance<DataType extends Record<string, any> = Record<string, any>> = CollectionDataInstance<DataType>
export type DataKey = string | number

// TODO: Remove the State Instance from the Data Instance's internalStore in favor of watchableValue's internalStore & logic
type DataObjectType<PK extends string = "id"> = Record<string, any> & { [Key in PK]: DataKey }
export class CollectionDataInstance<DataType extends DataObjectType<PK> = any, PK extends string = string> extends WatchableMutable<DataType> {
	// private instance: () => PlexusInstance
	primaryKey: PK
	private _internalStore: PlexusDataStore<DataType>
	constructor(
		instance: () => PlexusInstance,
		public collection: () => PlexusCollectionInstance<DataType>,
		primaryKey: PK,
		value: DataType,
		config: CollectionDataConfig = { prov: false }
	) {
		super(instance, value)
		// this.instance = instance
		this.primaryKey = primaryKey
		this._internalStore = {
			_key: value ? value[primaryKey] : value,
			primaryKey,
			_wDestroyers: new Set<() => void>(),
			_config: config,
		}
		// this.value = value
		if (!config.prov) {
			this.mount()
		}

		if (config.unfoundKeyIsUndefined) {
		}
	}
	/**
	 * The internal id of the state with an instance prefix
	 */
	get id(): string {
		// return this._internalStore._internalId
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the state with an instance prefix
	 */
	get instanceId(): string {
		// return this._internalStore._internalId
		return `dat_${this._watchableStore._internalId}`
	}

	private mount() {
		if (!this.instance()._collectionData.has(this)) {
			this.instance()._collectionData.add(this)
			this.instance().runtime.log("info", `Hoisting collection data ${this.instanceId} with value`, this._watchableStore._value, `to instance`)
			// if (this._internalStore._persist) {
			// 	this.instance().storage?.sync()
			// }
		}
	}

	private checkIfHasKey(value: Partial<DataType>) {
		// Check if the value has the primary key, and verify the key is the same as the data instance
		const isCurrentKey = value?.[this._internalStore.primaryKey as PK].toString().trim() === this._internalStore._key.toString().trim()
		// if the key is not the same, then we can't use this value
		const valid = value?.[this._internalStore.primaryKey] !== undefined && isCurrentKey
		this.instance().runtime.log(
			"warn",
			`The incoming value key does ${valid ? "" : "NOT"} match the stored key...`,
			this._internalStore._key,
			value?.[this._internalStore.primaryKey] === this._internalStore._key
		)
		return valid
	}
	/**
	 * Get the value of the data instance
	 */
	get value() {
		return super.value
	}
	/**
	 * The previous (reactive) value of the state
	 */
	get lastValue() {
		return deepClone(this._watchableStore._lastValue)
	}
	/**
	 * The initial (default) value of the state
	 */
	get initialValue() {
		return deepClone(this._watchableStore._initialValue)
	}
	/**
	 * Set the value of the data instance
	 * @param value The value to set
	 */
	set(value?: Partial<DataType>) {
		if (!value) return this

		// maybe this check should be done inside of the state?
		if (!isEqual(value as DataType, this.value)) {
			if (this.checkIfHasKey(value)) {
				// this._internalStore._state.set(value as DataType)
				super.set(value as DataType)
			}
			// give the id to the new value if it's missing
			super.set({ ...value, [this.primaryKey]: this.value[this.primaryKey] } as DataType)
		} else {
			this.instance().runtime.log(
				"warn",
				`Tried applying the same value to data "${this.value[this.primaryKey]}" in collection ${this.collection().id}...`
			)
		}
		this.collection().lastUpdatedKey = this._internalStore._key
		return this
	}
	/**
	 * Patch the current value of the state
	 * @param value A value of the state to merge with the current value
	 */
	patch(value: Partial<DataType>) {
		// if (this.checkIfHasKey(value)) {
		// 	// this._internalStore._state.patch(value as DataType)
		// }
		this.set(deepMerge(this._watchableStore._value, value))

		this.collection().lastUpdatedKey = this._internalStore._key
		return this
	}

	/**
	 * Compare a thing to the current value, if they are equal, returns true
	 * @param value The thing to compare the current value to
	 * @returns {boolean} A boolean representing if they are equal
	 */
	isEqual(value: any) {
		return isEqual(value, super._watchableStore._value)
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
		// this.instance()._states.delete(this._internalStore._state)
		this.instance()._collectionData.delete(this)
	}
	/**
	 * Watch for changes on this data instance
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<DataType>, from?: string) {
		// const destroyer = this._internalStore._state.watch(callback)
		const destroyer = super.watch(callback, from)
		return destroyer
	}
}

export function _data<DataType extends Record<string, any>>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<DataType>,
	primaryKey: string,
	value: DataType,
	config: CollectionDataConfig = { prov: false }
) {
	if ((value?.[primaryKey] !== undefined && value?.[primaryKey] !== null) || config.prov) {
		return new CollectionDataInstance(instance, collection, primaryKey, value, config)
	}
	return null
}
