import { PlexusCollectionInstance } from ".."
import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"
import { WatchableValue } from "../watchable"

import { DataKey, PlexusDataInstance } from "./data"
export type SelectorName = string
interface CollectionSelectorStore<ValueType = any> {
	_name: string
	_key: DataKey | null
	_collectionId: string
}

export type PlexusCollectionSelector<ValueType extends Record<string, any> = Record<string, any>> = CollectionSelector<ValueType>
export class CollectionSelector<ValueType extends Record<string, any>> extends WatchableValue<ValueType> {
	private _internalStore: CollectionSelectorStore<ValueType>
	private collection: () => PlexusCollectionInstance<ValueType>
	private instance: () => PlexusInstance
	constructor(instance: () => PlexusInstance, collection: () => PlexusCollectionInstance<ValueType>, name: string) {
		super(instance, {} as ValueType)
		this._internalStore = {
			_name: name,
			_key: null as DataKey | null,
			_collectionId: collection().name,
		}
		this.collection = collection
		this.instance = instance
	}
	/**
	 * The key of a data item assigned to this selector
	 */
	get key() {
		return this._internalStore._key
	}
	/**
	 * Select an item in the collection
	 * @param key The key to select
	 */
	select(key: DataKey) {
		this._internalStore._key = key
		this.set(this.value)
	}
	/**
	 * Set the value of the selected data instance
	 * @param value The value to set
	 * @param config The config to use when setting the value
	 * @param config.mode should we 'patch' or 'replace' the value
	 */
	set(value: ValueType, config: { mode: "replace" | "patch" } = { mode: "replace" }) {
		// TODO add a warning here if the key is not set
		this.data?.set(value, config)
	}
	/**
	 * Return the data value of the selected item
	 */
	get value() {
		if (this._internalStore._key === null) {
			return {} as ValueType
		}
		return this.collection().getItemValue(this._internalStore._key) || ({} as ValueType)
	}
	/**
	 * The data of the selector
	 */
	get data() {
		if (this._internalStore._key === null) {
			return null
		}
		return this.collection().getItem(this._internalStore._key) || null
	}
	/**
	 * Watch for changes on this group
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<ValueType>) {
		return this.data?.watch(callback) || (() => {})
	}
}

export function _selector<ValueType extends Record<string, any> = Record<string, any>>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<ValueType>,
	name: string
): PlexusCollectionSelector<ValueType> {
	return new CollectionSelector(instance, collection, name)
}
