import { PlexusCollectionInstance } from ".."
import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"

import { DataKey, PlexusDataInstance } from "./data"
export type SelectorName = string
export interface PlexusCollectionSelector<ValueType extends Record<string, any> = Record<string, any>> {
	/**
	 * The key of a data item assigned to this selector
	 */
	get key(): DataKey | null
	/**
	 * Select an item in the collection
	 * @param key The key to select
	 */
	select(key: DataKey)
	/**
	 * Set the value of the selected data instance
	 * @param value The value to set
	 * @param config The config to use when setting the value
	 * @param config.mode should we 'patch' or 'replace' the value
	 */
	set(value: ValueType, config?: { mode: "replace" | "patch" }): void
	/**
	 * Watch for changes on this group
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<ValueType>): () => void
	/**
	 * Return the data value of the selected item
	 */
	get value(): ValueType | null
	/**
	 * The data of the selector
	 */
	get data(): PlexusDataInstance<ValueType> | null
}

export function _selector<ValueType extends Record<string, any> = Record<string, any>>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<ValueType>,
	name: string
): PlexusCollectionSelector<ValueType> {
	const _internalStore = {
		_name: name,
		_key: null as DataKey | null,
		_collectionId: collection().name,
	}

	return {
		get key() {
			return _internalStore._key
		},
		select(key: DataKey) {
			_internalStore._key = key
		},
		set(value: ValueType, config: { mode: "replace" | "patch" } = { mode: "replace" }) {
			// TODO add a warning here if the key is not set
			this.data?.set(value, config)
		},
		get value() {
			if (_internalStore._key === null) {
				return null
			}
			return collection().getItemValue(_internalStore._key) || null
		},
		get data() {
			if (_internalStore._key === null) {
				return null
			}
			return collection().getItem(_internalStore._key) || null
		},
		watch(callback: PlexusWatcher<ValueType>) {
			return this.data?.watch(callback) || (() => {})
		},
	}
}
