import { PlexusWatchableValueInterpreter } from '@plexusjs/utils'
import { PlexusCollectionInstance } from '..'
import { PlexusInstance } from '../instance/instance'
import { PlexusInternalWatcher } from '../types'
import { Watchable } from '../watchable'

import { DataKey, PlexusDataInstance } from './data'

export interface PlexusCollectionGroupConfig<DataType> {
	addWhen?: (item: PlexusWatchableValueInterpreter<DataType>) => boolean
}
export type GroupName = string

export type PlexusCollectionGroup<DataType extends Record<string, any> = any> =
	CollectionGroup<DataType>

interface CollectionGroupStore<DataType = any> {
	addWhen: (value: PlexusWatchableValueInterpreter<DataType>) => boolean
	_name: string
	_collectionId: string
	_includedKeys: Set<string>
	_dataWatcherDestroyers: Set<() => void>
}

/**
 * A group of data
 */
export class CollectionGroup<
	DataType extends Record<string, any> = any
> extends Watchable<DataType[]> {
	private _internalStore: CollectionGroupStore<DataType>
	private collection: () => PlexusCollectionInstance<DataType>
	// private instance: () => PlexusInstance
	config: PlexusCollectionGroupConfig<DataType>

	/**
	 * The internal ID of the Group
	 * @type {string}
	 */
	get id() {
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the group with an instance prefix
	 * @type {string}
	 */
	get instanceId(): string {
		// return this._internalStore._internalId
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
		// this.instance = instance
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
		this.instance().runtime.log(
			'info',
			`Group ${this.instanceId} running watchers...`
		)
		const keys = Array.from(this._internalStore._includedKeys)
		// memoization: this updates the groups stored value! This reduces computation as the state of the group is only updated when the data changes
		this._watchableStore._publicValue = keys
			.map((key) => this.collection().getItemValue(key))
			.filter((v) => v !== undefined) as DataType[]
		this.instance().runtime.broadcast(this.id, this.value)
	}
	private rebuildDataWatchers(startedFromInnerBatch?: boolean) {
		this.instance().runtime.log(
			'info',
			`Group ${this.instanceId} rebuilding data watcher connections...`
		)

		// if the instance is batching and this collection has batching enabled, add this action to the batchedSetters
		// if (
		// 	this.instance().runtime.isBatching &&
		// 	this.collection().config.useBatching &&
		// 	!startedFromInnerBatch
		// ) {
		// 	this.instance().runtime.log(
		// 		'debug',
		// 		`Batching a group watcher rebuild for group ${this.instanceId}`
		// 	)
		// 	// store this in the batchedSetters for execution once batching is over
		// 	this.instance().runtime.batchedCalls.push(() => {
		// 		this.instance().runtime.log(
		// 			'debug',
		// 			`Batched addToGroups call fulfilled for collection ${this.instanceId}`
		// 		)
		// 		// return collectItem(item, groups, true)

		// 		this.rebuildDataWatchers(true)
		// 	})
		// 	return this
		// }
		// start the process of rebuilding the data watchers
		this._internalStore._dataWatcherDestroyers.forEach((destroyer) =>
			destroyer()
		)
		this._internalStore._dataWatcherDestroyers.clear()

		// loop through each key, get the data associated with it, then add a watcher to that data that runs the group's watchers
		const keys = Array.from(this._internalStore._includedKeys)
		keys.forEach((key) => {
			const destroyer = this.collection()
				.getItem(key)
				?.watch(() => {
					this.runWatchers()
				}, this.id)
			if (destroyer) this._internalStore._dataWatcherDestroyers.add(destroyer)
		})

		this.runWatchers()
	}
	/**
	 * Check if the group contains the given item
	 * @param {string|number} key The key of the item to look for
	 * @returns {boolean} Whether or not the group contains the item
	 */
	has(key: DataKey): boolean {
		return this._internalStore._includedKeys.has(key)
	}
	/**
	 * Add an item to the group
	 * @param {string|number} keys The key or array of keys of the item to look for
	 * @returns {this} This Group instance
	 */
	add(keys: DataKey | DataKey[]): this {
		if (!keys) return this
		this.instance().runtime.log(
			'debug',
			`Group ${this.instanceId} adding keys ${keys}...`
		)
		// normalize the keys
		const keysArray = Array.isArray(keys) ? keys : [keys]
		let newKeysAdded = false
		// add the keys to the group
		keysArray.forEach((key) => {
			if (this._internalStore._includedKeys.has(key)) {
				this.instance().runtime.log(
					'debug',
					`Group ${this.instanceId} already contains key ${key}...`
				)
				return
			}
			newKeysAdded = true
			this._internalStore._includedKeys.add(key)
		})
		// this._internalStore._includedKeys.add(key)
		if (newKeysAdded) {
			this.rebuildDataWatchers()
		}
		return this
	}
	/**
	 * Remove an item from the group
	 * @param {string|number} key The key of the item to look for
	 * @returns {this} This Group instance
	 */
	remove(keys: DataKey | DataKey[]): this {
		this.instance().runtime.log(
			'debug',
			`Group ${this.instanceId} removing keys ${keys}...`
		)
		// normalize the keys
		const keysArray = Array.isArray(keys) ? keys : [keys]
		// remove the keys from the group
		keysArray.forEach((key) => this._internalStore._includedKeys.delete(key))
		// this._internalStore._includedKeys.delete(key)
		this.rebuildDataWatchers()
		return this
	}
	/**
	 * Clears the group of all items
	 * @returns {this} This Group instance
	 */
	clear(): this {
		this._internalStore._includedKeys.clear()
		this.rebuildDataWatchers()
		return this
	}
	/**
	 * Peek at the index of the group (get all of the lookup keys for the group)
	 * @type {Set<string | number>}
	 */
	get index() {
		return this._internalStore._includedKeys
	}
	/**
	 * The data values of the items in the group
	 * @type {DataType[]}
	 */
	get value() {
		return super.value
	}
	/**
	 * The data Items in the group
	 * @type {PlexusDataInstance[]}
	 */
	get data() {
		return Array.from(this._internalStore._includedKeys).map((key) =>
			this.collection().getItem(key)
		)
	}

	/**
	 * The number of things in the group (length of the index array)
	 * @type {number}
	 */
	get size() {
		return this._internalStore._includedKeys.size
	}
	/**
	 * Watch for changes on this group
	 * @callback killWatcher
	 * @param callback The callback to run when the state changes
	 * @returns {killWatcher} The remove function to stop watching
	 */
	watch(
		callback: PlexusInternalWatcher<
			PlexusWatchableValueInterpreter<DataType>[]
		>,
		from?: string
	): () => void {
		return this.instance().runtime.subscribe(this.id, callback, from)
	}
}

export function _group<DataType extends Record<string, any> = any>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<DataType>,
	name: string,
	config?: PlexusCollectionGroupConfig<DataType>
): PlexusCollectionGroup<DataType> {
	return new CollectionGroup(instance, collection, name, config)
}
