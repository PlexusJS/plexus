import { PlexusCollectionInstance } from ".."
import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"
import { WatchableMutable } from "../watchable"

import { DataKey, PlexusDataInstance } from "./data"
export type SelectorName = string
interface CollectionSelectorStore<ValueType = any> {
	_name: string
	_key: DataKey | null
	_collectionId: string
	_dataWatcherDestroyer: (() => void) | null
	_watchers: Set<PlexusWatcher<ValueType>>
}

export type PlexusCollectionSelector<ValueType extends Record<string, any> = Record<string, any>> = CollectionSelector<ValueType>
export class CollectionSelector<ValueType extends Record<string, any>> extends WatchableMutable<ValueType> {
	private _internalStore: CollectionSelectorStore<ValueType>
	private collection: () => PlexusCollectionInstance<ValueType>
	private instance: () => PlexusInstance

	/**
	 * The internal ID of the Selector
	 */
	get id() {
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the Selector with an instance prefix
	 */
	get instanceId(): string {
		// return this._internalStore._internalId
		return `sel_${this._watchableStore._internalId}`
	}
	constructor(instance: () => PlexusInstance, collection: () => PlexusCollectionInstance<ValueType>, name: string) {
		super(instance, {} as ValueType)
		this._internalStore = {
			_name: name,
			_key: null as DataKey | null,
			_collectionId: collection().id,
			_dataWatcherDestroyer: null,
			_watchers: new Set(),
		}
		this.collection = collection
		this.instance = instance
	}
	private runWatchers() {
		this._internalStore._watchers.forEach((callback) => {
			this.instance().runtime.log("info", `Running watchers on selector ${this.instanceId}...`)
			callback(this.value)
		})
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
		if (key === this._internalStore._key) {
			this.instance().runtime.log("warn", `Tried selecting the same key, skipping selection on selector ${this.instanceId}...`)
			return
		}
		this._internalStore._dataWatcherDestroyer?.()

		this._internalStore._key = key
		// this.set(this.value)
		const dataWatcherDestroyer =
			this.data?.watch((value) => {
				this.runWatchers()
			}) || null
		this._internalStore._dataWatcherDestroyer = dataWatcherDestroyer

		// broadcast the change
		this.runWatchers()
	}
	/**
	 * Set the value of the selected data instance
	 * @param value The value to set
	 * @param config The config to use when setting the value
	 * @param config.mode should we 'patch' or 'replace' the value
	 */
	set(value: ValueType, config: { mode: "replace" | "patch" } = { mode: "replace" }) {
		// TODO add a warning here if the key is not set
		config.mode === "replace" ? this.data?.set(value) : this.data?.patch(value)
		this.runWatchers()
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
		this._internalStore._watchers.add(callback)

		// const destroyer = this.data?.watch(callback)
		const destroyer = () => {
			this._internalStore._watchers.delete(callback)
		}
		return destroyer
	}
}

export function _selector<ValueType extends Record<string, any> = Record<string, any>>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<ValueType>,
	name: string
): PlexusCollectionSelector<ValueType> {
	return new CollectionSelector(instance, collection, name)
}
