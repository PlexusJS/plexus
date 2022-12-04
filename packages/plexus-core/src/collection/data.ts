import { WatchableMutable } from './../watchable'
import { PlexusInstance } from '../instance'
import { PlexusWatcher } from '../interfaces'
import { PlexusCollectionInstance } from './collection'
import { deepClone, deepMerge, isEqual } from '@plexusjs/utils'

interface CollectionDataConfig {
	prov: boolean
	unfoundKeyIsUndefined?: boolean
}
interface PlexusDataStore<DataType extends Record<string, any>> {
	primaryKey: string
	_wDestroyers: Set<() => void>
	_config: CollectionDataConfig
}

export type PlexusDataInstance<
	DataType extends Record<string, any> = Record<string, any>
> = CollectionData<DataType>
export type DataKey = string | number

// TODO: Remove the State Instance from the Data Instance's internalStore in favor of watchableValue's internalStore & logic
type DataObjectType<PK extends string = 'id'> = Record<string, any> & {
	[Key in PK]: DataKey
}

/**
 * A piece of data belonging to a collection
 */
export class CollectionData<
	DataType extends DataObjectType<PK> = any,
	PK extends string = string
> extends WatchableMutable<DataType> {
	private primaryKey: PK
	readonly key: string | number
	provisional: boolean
	private _internalStore: PlexusDataStore<DataType>

	constructor(
		instance: () => PlexusInstance,
		public collection: () => PlexusCollectionInstance<DataType>,
		primaryKey: PK,
		keyValue: string | number,
		value: DataType,
		config: CollectionDataConfig = { prov: false }
	) {
		super(instance, value)
		this.provisional = config.prov
		this.primaryKey = primaryKey
		this.key = keyValue

		this._internalStore = {
			primaryKey,
			_wDestroyers: new Set<() => void>(),
			_config: config,
		}
		if (!this.provisional) {
			this.mount()
		}
	}
	/**
	 * The internal id of the state with an instance prefix
	 * @type {string}
	 */
	get id(): string {
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the state with an instance prefix
	 * @type {string}
	 */
	get instanceId(): string {
		return `dat_${this._watchableStore._internalId}`
	}

	private mount() {
		if (!this.instance()._collectionData.has(this)) {
			this.instance()._collectionData.add(this)
			this.instance().runtime.log(
				'info',
				`Hoisting collection data ${this.instanceId} with value`,
				this._watchableStore._value,
				`to instance`
			)
		}
	}

	private checkIfHasKey(value?: Partial<DataType>): boolean {
		// if the value is undefined/null
		if (!value || !value[this._internalStore.primaryKey as PK]) {
			return false
		}
		// Check if the value has the primary key, and verify the key is the same as the data instance
		const isCurrentKey =
			value[this._internalStore.primaryKey as PK].toString().trim() ===
			this.key.toString().trim()
		// if the key is not the same, then we can't use this value
		const valid =
			value[this._internalStore.primaryKey] !== undefined && isCurrentKey
		this.instance().runtime.log(
			'warn',
			`The incoming value key does ${
				valid ? '' : 'NOT'
			} match the stored key...`,
			this.key,
			value[this._internalStore.primaryKey] === this.key
		)
		return valid
	}
	/**
	 * Get the value of the data instance
	 * @type {DataType}
	 */
	get value() {
		const foreignKeys = this.collection().config.foreignKeys
		if (foreignKeys) {
			// type ForeignRecords = Record<
			// 	keyof typeof foreignKeys[keyof typeof foreignKeys]["newKey"],
			// 	ReturnType<typeof foreignKeys[keyof typeof foreignKeys]["reference"]>
			// >

			let value = { ...super.value } as Partial<any> & DataType
			let idKey: keyof DataType

			for (idKey of Object.keys(foreignKeys ?? {})) {
				const newKey: keyof Partial<any> = foreignKeys[idKey]
					?.newKey as keyof Partial<any>
				const that = this

				// console.log(
				// 	newKey,
				// 	'from',
				// 	foreignKeys[idKey]?.reference,
				// 	that.instance().findReference(foreignKeys[idKey]?.reference || ''),
				// 	"here's the data",
				// 	foreignKeys[idKey]?.newKey,
				// 	that
				// 		.instance()
				// 		.findReference(foreignKeys[idKey]?.reference || '')
				// 		?.getItem(that.shallowValue[idKey]).shallowValue
				// )

				value = new Proxy<any>(value, {
					get(target, p, reciever) {
						const freshValue =
							that
								.instance()
								.findReference(foreignKeys[idKey]?.reference || '')
								?.getItem(that.shallowValue[idKey]).shallowValue || ({} as any)
						console.log('get', p, target, reciever, freshValue)
						if (p === newKey) {
							return freshValue
						}
						return Reflect.get(target, p, reciever)
					},
				}) as DataType & Record<typeof newKey, any>
			}
			// console.log('new value', value)

			return value
		}
		return super.value
	}
	/**
	 * Get the shallow value of the data instance
	 * @type {DataType}
	 */
	get shallowValue() {
		return super.value
	}
	/**
	 * The previous (reactive) value of the state
	 * @type {DataType}
	 */
	get lastValue() {
		return deepClone(this._watchableStore._lastValue)
	}
	/**
	 * The initial (default) value of the state
	 * @type {DataType}
	 */
	get initialValue() {
		return deepClone(this._watchableStore._initialValue)
	}
	/**
	 * Set the value of the data instance
	 * @param {DataType} value The value to set
	 * @returns {this} The data instance
	 */
	set(value?: Partial<DataType>): this {
		if (!value) return this

		// if this is provisional, mount to the collection & instance
		if (this.provisional) {
			this.instance().runtime.log(
				'debug',
				`Mounting provisional data instance "${this.key}" to instance...`
			)
			this.mount()
			this.provisional = false
		}

		if (!isEqual(value as DataType, this._watchableStore._value)) {
			if (this.checkIfHasKey(value)) {
				super.set(value as DataType)
			} else {
				// give the id to the new value if it's missing
				super.set({ ...value, [this.primaryKey]: this.key } as DataType)
			}
		} else {
			this.instance().runtime.log(
				'warn',
				`Tried applying the same value to data "${this.key}" in collection ${
					this.collection().id
				}...`
			)
		}
		this.collection().lastUpdatedKey = this.key

		return this
	}
	/**
	 * Patch the current value of the state
	 * @param {DataType} value A value of the state to merge with the current value
	 * @returns {this} The data instance
	 */
	patch(value: Partial<DataType>): this {
		this.set(deepMerge(this._watchableStore._value, value))

		this.collection().lastUpdatedKey = this.key
		return this
	}

	/**
	 * Compare a thing to the current value, if they are equal, returns true
	 * @param value The thing to compare the current value to
	 * @returns {boolean} A boolean representing if they are equal
	 */
	isEqual(value: any): boolean {
		return isEqual(value, super._watchableStore._value)
	}
	/**
	 * Delete the data instance
	 * @returns {this} The data instance
	 */
	delete(): this {
		this.collection().delete(this.key)
		return this
		// delete _internalStore._state
	}
	/**
	 * Clean this data instance (remove all watchers & remove the state from the instance)
	 * @returns {this} The data instance
	 */
	clean(): this {
		this._internalStore._wDestroyers.forEach((destroyer) => destroyer())
		this._internalStore._wDestroyers.clear()
		this.instance()._collectionData.delete(this)
		return this
	}
	/**
	 * Watch for changes on this data instance
	 * @callback WatchCallback
	 * @callback killWatcher
	 * @param {WatchCallback} callback The callback to run when the state changes
	 * @returns {killWatcher} The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<DataType>, from?: string) {
		const destroyer = super.watch(callback, from)
		return destroyer
	}
}

export function _data<DataType extends Record<string, any>>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<DataType>,
	primaryKey: string,
	keyValue: number | string,
	value: DataType,
	config: CollectionDataConfig = { prov: false }
) {
	if (
		(value?.[primaryKey] !== undefined && value?.[primaryKey] !== null) ||
		config.prov
	) {
		return new CollectionData(
			instance,
			collection,
			primaryKey,
			keyValue,
			value,
			config
		)
	}
	return null
}
