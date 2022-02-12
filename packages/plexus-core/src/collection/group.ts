import { PlexusCollectionInstance } from ".."
import { PlexusInstance } from "../instance"
import { PlexusStateWatcher } from "../state"
import { DataKey, PlexusDataInstance } from "./data"

export interface PlexusCollectionGroupConfig<DataType> {
	addWhen?: (item: DataType) => boolean
}
export type GroupName = string
export interface PlexusCollectionGroup<DataType> {
	/**
	 * Check if the group contains the given item
	 * @param key The key of the item to look for
	 */
	has(key: DataKey): boolean
	/**
	 * Add an item to the group
	 * @param key The key of the item to look for
	 */
	add(key: DataKey): PlexusCollectionGroup<DataType>
	/**
	 * Remove an item from the group
	 * @param key The key of the item to look for
	 */
	remove(key: DataKey): PlexusCollectionGroup<DataType>
	/**
	 * Watch for changes on this group
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusStateWatcher<DataType>): () => void
	/**
	 * Peek at the index of the group (get all of the lookup keys for the group)
	 */
	get index(): Set<DataKey>
	/**
	 * The data values of the items in the group
	 */
	get value(): DataType[]
	/**
	 * The data in the group
	 */
	get data(): PlexusDataInstance<DataType>[]
}
export function _group<DataType = any>(
	instance: () => PlexusInstance,
	collectionId: string,
	name: string,
	config?: PlexusCollectionGroupConfig<DataType>
) {
	const _internalStore = {
		addWhen: config?.addWhen || (() => false),
		_name: name,
		_collectionId: collectionId,
		_includedKeys: new Set<string | number>(),
	}

	return Object.freeze({
		has(key: DataKey) {
			return _internalStore._includedKeys.has(key)
		},
		add(key: DataKey) {
			_internalStore._includedKeys.add(key)
			return this as PlexusCollectionGroup<DataType>
		},
		remove(key: DataKey) {
			_internalStore._includedKeys.delete(key)
			return this as PlexusCollectionGroup<DataType>
		},
		get index() {
			return _internalStore._includedKeys
		},
		get value() {
			return instance()._collections.get(_internalStore._collectionId).groupsValue[_internalStore._name]
		},
		get data() {
			return Array.from(_internalStore._includedKeys).map((key) =>
				instance()._collections.get(_internalStore._collectionId).getItem(key)
			)
		},
		watch(callback?: PlexusStateWatcher<DataType>) {
			const destroyers = this.data.map((data) => data.watch(callback))
			const destroyer = () => {
				destroyers.forEach((destroyer) => destroyer())
			}
			return destroyer
		},
	})
}
