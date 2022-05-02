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
	_watcherDestroyers: Set<() => void>
	_watchers: Set<PlexusWatcher<DataType[]>>
}
export class CollectionGroup<DataType = any> extends WatchableValue<DataType[]> {
	private _internalStore: CollectionGroupStore<DataType>
	private collection: () => PlexusCollectionInstance<DataType>
	private instance: () => PlexusInstance
	config: PlexusCollectionGroupConfig<DataType>

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
			_collectionId: collection().name,
			_includedKeys: new Set(),
			_watcherDestroyers: new Set(),
			_watchers: new Set(),
		}
	}
	private runWatchers() {
		this._internalStore._watchers.forEach((callback) => {
			this.instance().runtime.log("warn", "_GroupsValue_\n", this.collection().groups)
			callback(this.collection().getGroup(this._internalStore._name).value)
		})
	}
	private rebuildWatchers() {
		this._internalStore._watcherDestroyers.forEach((destroyer) => destroyer())
		this._internalStore._watcherDestroyers.clear()

		Array.from(this._internalStore._includedKeys).forEach((key) => {
			const destroyer = this.collection()
				.getItem(key)
				?.watch(() => {
					// console.log("watching a new item")
					this.runWatchers()
				})
			if (destroyer) this._internalStore._watcherDestroyers.add(destroyer)
		})
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
		this.rebuildWatchers()
		return this as PlexusCollectionGroup<DataType>
	}
	/**
	 * Remove an item from the group
	 * @param key The key of the item to look for
	 */
	remove(key: DataKey) {
		this._internalStore._includedKeys.delete(key)
		this.rebuildWatchers()
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
	 * The data in the group
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
		// const destroyers = this.data.map((data) => data.watch(callback))
		this._internalStore._watchers.add(callback)
		const destroyer = () => {
			// destroyers.forEach((destroyer) => destroyer())
			this._internalStore._watchers.delete(callback)
		}
		return destroyer
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
