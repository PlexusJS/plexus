import { PlexusCollectionInstance } from ".."
import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"
import { WatchableValue } from "../watchable"

import { DataKey, PlexusDataInstance } from "./data"

export interface PlexusCollectionGroupConfig<DataType> {
	addWhen?: (item: DataType) => boolean
}
export type GroupName = string

export type PlexusCollectionGroup<DataType = any> = CollectionGroup<DataType>

interface CollectionGroupStore<DataType = any> {
	addWhen: (value: DataType) => boolean
	_name: string
	_collectionId: string
	_includedKeys: Set<string | number>
	_dataWatcherDestroyers: Set<() => void>
}
export class CollectionGroup<DataType = any> extends WatchableValue<DataType[]> {
	private _internalStore: CollectionGroupStore<DataType>
	private collection: () => PlexusCollectionInstance<DataType>
	private instance: () => PlexusInstance
	config: PlexusCollectionGroupConfig<DataType>

	/**
	 * The internal ID of the Group
	 */
	get id() {
		return `grp_${this._watchableStore._internalId}`
	}

	constructor(
		instance: () => PlexusInstance,
		collection: () => PlexusCollectionInstance<DataType>,
		name: string,
		config?: PlexusCollectionGroupConfig<DataType>
	) {
		super(instance, [])
		this.collection = collection
		this.instance = instance
		this.config = config ?? {}

		this._internalStore = {
			addWhen: config?.addWhen || (() => false),
			_name: name,
			_collectionId: collection().id,
			_includedKeys: new Set(),
			_dataWatcherDestroyers: new Set(),
		}
	}
	private runWatchers() {
		this.instance().runtime.log("info", `Running watchers on group ${this._internalStore._name}(${this.id})...`)
		// this._internalStore._groupWatchers.forEach((callback) => {
		// 	callback(this.value)
		// })
		this.instance().runtime.broadcast(this.id, this.value)
	}
	private rebuildDataWatchers() {
		this.instance().runtime.log("info", `Rebuilding data watcher connections on group ${this._internalStore._name}(${this.id})...`)
		this._internalStore._dataWatcherDestroyers.forEach((destroyer) => destroyer())
		this._internalStore._dataWatcherDestroyers.clear()

		// loop through each key, get the data associated with it, then add a watcher to that data that runs the group's watchers
		Array.from(this._internalStore._includedKeys).forEach((key) => {
			const destroyer = this.collection()
				.getItem(key)
				?.watch(() => {
					this.runWatchers()
				})
			if (destroyer) this._internalStore._dataWatcherDestroyers.add(destroyer)
		})
		this.runWatchers()
	}
	/**
	 * Check if the group contains the given item
	 * @param key The key of the item to look for
	 */
	has(key: DataKey) {
		return this._internalStore._includedKeys.has(key)
	}
	/**
	 * Add an item to the group
	 * @param key The key of the item to look for
	 */
	add(key: DataKey) {
		this._internalStore._includedKeys.add(key)
		this.rebuildDataWatchers()
		return this as PlexusCollectionGroup<DataType>
	}
	/**
	 * Remove an item from the group
	 * @param key The key of the item to look for
	 */
	remove(key: DataKey) {
		this._internalStore._includedKeys.delete(key)
		this.rebuildDataWatchers()
		return this as PlexusCollectionGroup<DataType>
	}
	/**
	 * Clears the group of all items
	 * @returns {this} This Group instance
	 */
	clear() {
		this._internalStore._includedKeys.clear()
		this.rebuildDataWatchers()
		return this as PlexusCollectionGroup<DataType>
	}
	/**
	 * Peek at the index of the group (get all of the lookup keys for the group)
	 */
	get index() {
		return this._internalStore._includedKeys
	}
	/**
	 * The data values of the items in the group
	 */
	get value() {
		return Array.from(this._internalStore._includedKeys)
			.map((key) => this.collection().getItemValue(key))
			.filter((v) => v !== undefined) as DataType[]
	}
	/**
	 * The data Items in the group
	 */
	get data() {
		return Array.from(this._internalStore._includedKeys).map((key) => this.collection().getItem(key))
	}
	/**
	 * Watch for changes on this group
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<DataType[]>) {
		// this._internalStore._groupWatchers.add(callback)
		// const destroyer = () => {
		// 	this._internalStore._groupWatchers.delete(callback)
		// }
		// return destroyer
		return this.instance().runtime.subscribe(this.id, callback)
	}
}

export function _group<DataType = any>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<DataType>,
	name: string,
	config?: PlexusCollectionGroupConfig<DataType>
): PlexusCollectionGroup<DataType> {
	return new CollectionGroup(instance, collection, name, config)
}
