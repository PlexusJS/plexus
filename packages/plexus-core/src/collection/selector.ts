import { deepClone } from '@plexusjs/utils'
import { PlexusCollectionInstance } from '..'
import { PlexusInstance } from '../instance'
import { PlexusWatcher } from '../interfaces'
import { WatchableMutable } from '../watchable'

import { DataKey, PlexusDataInstance } from './data'
export type SelectorName = string
interface CollectionSelectorStore<ValueType = any> {
	_name: string
	_key: DataKey | null
	_collectionId: string
	_dataWatcherDestroyer: (() => void) | null
}

export type PlexusCollectionSelector<
	ValueType extends Record<string, any> = Record<string, any>
> = CollectionSelector<ValueType>

/**
 * A selector for data
 * @example
 * ```ts
 * const posts = collection().createSelector('myPosts')
 * poss.collect({id: 1, title: 'Hello World'})
 * posts.selectors.myPosts.select(1)
 * ```
 */
export class CollectionSelector<
	DataType extends Record<string, any>
> extends WatchableMutable<DataType> {
	private _internalStore: CollectionSelectorStore<DataType>
	private collection: () => PlexusCollectionInstance<DataType>
	private defaultValue: DataType
	// private instance: () => PlexusInstance

	/**
	 * The internal ID of the Selector
	 * @type {string}
	 */
	get id() {
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the Selector with an instance prefix
	 * @type {string}
	 */
	get instanceId(): string {
		return `sel_${this._watchableStore._internalId}`
	}
	constructor(
		instance: () => PlexusInstance,
		collection: () => PlexusCollectionInstance<DataType>,
		name: string
	) {
		super(instance, {} as DataType)
		this._internalStore = {
			_name: name,
			_key: null as DataKey | null,
			_collectionId: collection().id,
			_dataWatcherDestroyer: null,
		}
		this.collection = collection

		// the fallback value if the key or data is not found
		this.defaultValue = this.collection().config.unfoundKeyReturnsUndefined
			? (undefined as any as DataType)
			: ({} as DataType)
	}
	private runWatchers() {
		this.instance().runtime.log(
			'info',
			`Running watchers on selector ${this.instanceId}...`
		)
		// this._internalStore._watchers.forEach((callback) => {
		// 	callback(this.value)
		// })
		super.set(deepClone(this.value) as any)
	}
	/**
	 * The key of a data item assigned to this selector
	 * @type {DataKey | null}
	 */
	get key() {
		return this._internalStore._key
	}
	/**
	 * Select an item in the collection
	 * @param {string|number} key The key to select
	 * @returns {this} The selector instance
	 */
	select(key: DataKey): this {
		if (key === this._internalStore._key) {
			this.instance().runtime.log(
				'warn',
				`Tried selecting the same key, skipping selection on selector ${this.instanceId}...`
			)
			return this
		}
		// reset the history if there was one
		if (this.historyLength) {
			this.data?.history(0)
		}
		this._internalStore._key = key

		this._internalStore._dataWatcherDestroyer?.()

		// this.set(this.value)
		const dataWatcherDestroyer = this.data?.watch((value) => {
			this.runWatchers()
		}, this.id)
		this._internalStore._dataWatcherDestroyer = dataWatcherDestroyer || null
		this.instance().runtime.log(
			'info',
			`Selected data ${this.data?.instanceId} on selector ${this.instanceId}...`
		)
		// reinitialize history with the same stored length
		this.data?.history(this.historyLength)
		// broadcast the change
		this.runWatchers()
		return this
	}
	/**
	 * Set the value of the selected data instance
	 * @param {DataType} value The value to set
	 * @returns {this} The selector instance
	 */
	set(value: DataType): this {
		this.instance().runtime.log(
			'info',
			`Setting data value to ${JSON.stringify(value)} on selector ${
				this.instanceId
			}...`
		)
		// TODO add a warning here if the key is not set
		if (this.data) {
			this.data.set(value)
			this.runWatchers()
		}
		return this
	}
	/**
	 * Patch the value of the selected data instance
	 * @param {DataType} value The value to set
	 * @returns {this} The selector instance
	 */
	patch(value: Partial<DataType>): this {
		// TODO add a warning here if the key is not set
		if (this.data) {
			this.data.patch(value)
			this.runWatchers()
		}
		return this
	}

	/**
	 * Return the data value of the selected item
	 * @type {DataType}
	 */
	get value() {
		if (this._internalStore._key === null) {
			return this.defaultValue
		}
		return (
			this.collection().getItemValue(this._internalStore._key) ||
			this.defaultValue
		)
	}
	/**
	 * The data of the selector
	 * @type {PlexusDataInstance | null}
	 */
	get data() {
		if (this._internalStore._key === null) {
			return null
		}
		return this.collection().getItem(this._internalStore._key) || null
	}
	/**
	 * Watch for changes on this selector
	 * @callback watcher
	 * @callback killWatcher
	 * @param {watcher} callback The callback to run when the state changes
	 * @returns {killWatcher} The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<DataType>) {
		return super.watch((v) => {
			this.instance().runtime.log(
				'debug',
				`Watching selector ${this.instanceId} with a new callback`
			)
			callback(this.data?.value || v)
		})
	}
	private historyLength: number = 0

	/**
	 * Enable, disable, or set the history length of the state history stored for this selector
	 * @param {number} maxLength The maximum length of the history
	 * @returns {this} The selector instance
	 */
	history(maxLength: number = 10): this {
		this.historyLength = maxLength
		this.data?.history(maxLength)
		return this
	}
	/**
	 * Can the state be redone any further?
	 * @type {boolean}
	 */
	get canRedo(): boolean {
		return !!this.data?.canRedo
	}
	/**
	 * Can the state be undone any further?
	 * @type {boolean}
	 */
	get canUndo(): boolean {
		return !!this.data?.canUndo
	}
	/**
	 * Undo the last change to the state
	 * @returns {this} The selector instance
	 */
	undo(): this {
		this.data?.undo()
		return this
	}
	/**
	 * Redo the last change to the state
	 * @returns {this} The selector instance
	 */
	redo(): this {
		this.data?.redo()
		return this
	}
	/**
	 * Clears the selector
	 */
	clear(): this {
		this._internalStore._key = null
		this._internalStore._dataWatcherDestroyer?.()
		this._internalStore._dataWatcherDestroyer = null
		this.runWatchers()
		return this
	}
}

export function _selector<
	ValueType extends Record<string, any> = Record<string, any>
>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<ValueType>,
	name: string
): PlexusCollectionSelector<ValueType> {
	return new CollectionSelector(instance, collection, name)
}
