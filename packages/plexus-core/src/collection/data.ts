import { WatchableMutable } from './../watchable'
import { PlexusInstance } from '../instance/instance'
import { ForeignKeyData, PlexusCollectionInstance } from './collection'
import {
	PlexusWatchableValueInterpreter,
	deepClone,
	deepMerge,
	isEqual,
} from '@plexusjs/utils'

export type PlexusGroupWatcher<V extends any = any> = (
	value: V,
	primaryKey?: keyof V
) => void

interface CollectionDataConfig {
	prov?: boolean
	unfoundKeyIsUndefined?: boolean
	decay?: number
}
interface PlexusDataStore {
	primaryKey: string
	_wDestroyers: Set<() => void>
	config: CollectionDataConfig
}

export type PlexusDataInstance<
	DataType extends Record<string, any> = Record<string, any>,
> = CollectionData<DataType>
export type DataKey = string

type DataObjectType<PK extends string = 'id'> = Record<string, any> & {
	[Key in PK]: DataKey
}

/**
 * A piece of data belonging to a collection
 */
export class CollectionData<
	DataType extends DataObjectType<PK> = any,
	PK extends string = string,
> extends WatchableMutable<DataType> {
	private primaryKey: PK
	readonly key: string
	provisional: boolean
	private _internalStore: PlexusDataStore
	private foreignKeyData: Record<string | number | symbol, any> = {}
	private watchingForeignData: Map<string, () => void>
	private decayTimeout?: ReturnType<typeof setTimeout>

	constructor(
		instance: () => PlexusInstance,
		public collection: () => PlexusCollectionInstance<DataType>,
		primaryKey: PK,
		keyValue: string,
		value: DataType,
		config: CollectionDataConfig = { prov: false }
	) {
		super(instance, value)
		this.provisional = config.prov ?? false
		this.primaryKey = primaryKey
		this.key = keyValue + ''
		this.watchingForeignData = new Map()

		this._internalStore = {
			primaryKey,
			_wDestroyers: new Set<() => void>(),
			config: config,
		}
		if (!this.provisional) {
			this.mount()
			this.syncForeignKeyData(true)
		}
		if (config.decay) {
			this.decay(config.decay)
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

	private checkIfHasKey(
		value?: Partial<PlexusWatchableValueInterpreter<DataType>>
	): boolean {
		// if the value is undefined/null
		if (!value || !value[this._internalStore.primaryKey]) {
			return false
		}
		// Check if the value has the primary key, and verify the key is the same as the data instance
		const isCurrentKey =
			value[this._internalStore.primaryKey].toString().trim() ===
			this.key.toString().trim()
		// if the key is not the same, then we can't use this value
		const valid =
			value[this._internalStore.primaryKey] !== undefined && isCurrentKey
		this.instance().runtime.log(
			valid ? 'info' : 'warn',
			`The incoming value key ${
				valid ? 'matches' : 'does NOT match'
			} the stored key...`,
			this.key,
			value[this._internalStore.primaryKey] === this.key
		)
		return valid
	}

	syncForeignKeyData(injectListener: boolean = false) {
		// extract the foreign keys from the collection
		const foreignKeys = this.collection().config.foreignKeys
		if (foreignKeys && Object.keys(foreignKeys).length) {
			this.instance().runtime.log(
				'info',
				`Syncing foreign key data for Data instance ${this.instanceId} ${
					injectListener ? '(with listener injection)' : ''
				}`
			)
			// get the previous foreign key data stored for this data instance

			let idKey: string

			// loop through the foreign keys
			for (idKey of Object.keys(foreignKeys ?? {})) {
				const newKey = foreignKeys[idKey]?.newKey as string
				const isArray =
					foreignKeys[idKey]?.mode === 'array' ||
					Array.isArray(this.shallowValue?.[idKey])
				const foreignCollectionName = foreignKeys[idKey]?.reference as string
				const foreignCollection = this.instance().findReference(
					foreignCollectionName
				)

				// if we have a shallow value, then we can try to get the fresh value from the foreign collection
				if (this.shallowValue) {
					const freshValue = isArray
						? (this.shallowValue?.[idKey] as string[])
								?.map(
									(id: string) => foreignCollection?.getItem(id)?.shallowValue
								)
								.filter((x) => x) || undefined
						: foreignCollection?.getItem(this.shallowValue?.[idKey])
								?.shallowValue
					if (
						freshValue &&
						foreignCollection?.config.foreignKeys?.[idKey]?.newKey
					) {
						delete freshValue[idKey]
					}
					this.foreignKeyData = {
						...this.foreignKeyData,
						[newKey]: freshValue,
					}
				}
				// foreignCollection?.getItem(this.shallowValue?.[idKey])?.set()
				// Create a watcher for the foreign data
				if (
					foreignCollectionName &&
					foreignCollectionName !== this.collection().name &&
					injectListener
				) {
					const makeWatcher = (newKey: string, primaryKey: string) => {
						if (this.watchingForeignData.has(newKey)) {
							this.watchingForeignData.get(newKey)?.()
							this.watchingForeignData.delete(newKey)
						}
						const killWatcher = foreignCollection
							?.getItem(primaryKey)
							?.watch((value, pk) => {
								//
								if (
									pk &&
									value &&
									this.foreignKeyData &&
									value[pk] !== this.foreignKeyData[pk]
								)
									this.syncForeignKeyData(true)
							})
						if (killWatcher) {
							this.watchingForeignData.set(newKey, killWatcher)
						}
					}
					if (isArray) {
						this.shallowValue?.[idKey]?.forEach((id: string) => {
							makeWatcher(`${newKey}.${id}`, id)
						})
					} else {
						makeWatcher(newKey, this.shallowValue?.[idKey] as string)
					}
				}
			}
		}
	}
	private genValue(incomingValue?: PlexusWatchableValueInterpreter<DataType>) {
		this.syncForeignKeyData()
		const value = incomingValue
			? {
					...incomingValue,
					...this.foreignKeyData,
			  }
			: undefined

		return value as PlexusWatchableValueInterpreter<DataType> & {
			[key: string]: any
		}
	}
	/**
	 * Get the value of the data instance
	 * @type {!DataType}
	 */
	get value() {
		return this.genValue(
			super.value
		) as PlexusWatchableValueInterpreter<DataType> & { [key: string]: any }
	}
	/**
	 * Get the shallow value of the data instance (no foreign key values injected)
	 * @type {DataType}
	 */
	get shallowValue(): PlexusWatchableValueInterpreter<DataType> & {
		[key: string]: any
	} {
		return deepClone(
			super.value
		) as PlexusWatchableValueInterpreter<DataType> & {
			[key: string]: any
		}
	}

	/**
	 * Set the value of the data instance
	 * @param {DataType} value The value to set
	 * @returns {this} The data instance
	 */
	set(value?: Partial<PlexusWatchableValueInterpreter<DataType>>): this {
		if (!value) return this

		// if this is provisional, mount to the collection & instance
		if (this.provisional) {
			this.instance().runtime.log(
				'debug',
				`Data(provisional) ${this.instanceId} mounting to "${this.key}" to instance...`
			)
			this.mount()
			this.provisional = false
		}

		if (
			!isEqual(
				value as PlexusWatchableValueInterpreter<DataType>,
				this._watchableStore._value
			)
		) {
			if (this.checkIfHasKey(value)) {
				super.set(value as PlexusWatchableValueInterpreter<DataType>)
			} else {
				// give the id to the new value if it's missing
				super.set({
					...value,
					[this.primaryKey]: this.key,
				} as PlexusWatchableValueInterpreter<DataType>)
			}
			// in order to sync foreign keys, we need to check if the value has changed
			const foreignKeys = this.collection().config.foreignKeys
			for (let foreignKey of Object.keys(foreignKeys ?? {})) {
				if (
					this._watchableStore._value?.[foreignKey] &&
					this._watchableStore._lastValue?.[foreignKey] &&
					!isEqual(
						this._watchableStore._value?.[foreignKey],
						this._watchableStore._lastValue?.[foreignKey]
					)
				) {
					this.syncForeignKeyData()
					break
				}
			}
		} else {
			this.instance().runtime.log(
				'warn',
				`Data ${this.instanceId} tried applying the same value in collection ${
					this.collection().instanceId
				}...`
			)
		}
		this.collection().lastUpdatedKey = this.key
		const decayRate = this.collection().config.decay
		if (decayRate) {
			this.decay(decayRate)
		}
		return this
	}
	/**
	 * Patch the current value of the state
	 * @param {DataType} value A value of the state to merge with the current value
	 * @returns {this} The data instance
	 */
	patch(value: Partial<PlexusWatchableValueInterpreter<DataType>>): this {
		this.set(deepMerge(this._watchableStore._value, value, true))

		this.collection().lastUpdatedKey = this.key
		return this
	}

	/**
	 * Delete the data instance
	 * @returns {this} The data instance
	 */
	delete(): this {
		this.collection().delete(this.key)
		return this
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
	 * Decay this data instance after a certain amount of time
	 * @param {boolean|string}time The time to decay in ms
	 * @returns {this} The data instance
	 */
	decay(time: number | false) {
		this.instance().runtime.log(
			'debug',
			`Data ${this.instanceId} decaying in ${time}ms...`
		)
		if (this.decayTimeout) clearTimeout(this.decayTimeout)
		if (!time) return this

		this.decayTimeout = setTimeout(() => {
			this.delete()
		}, time)
		return this
	}
	/**
	 * Watch for changes on this data instance
	 * @callback WatchCallback
	 * @callback killWatcher
	 * @param {WatchCallback} callback The callback to run when the state changes
	 * @returns {killWatcher} The remove function to stop watching
	 */
	watch(
		callback: PlexusGroupWatcher<PlexusWatchableValueInterpreter<DataType>>,
		from?: string
	) {
		// this.syncForeignKeyData()
		const destroyer = super.watch((value) => {
			this.syncForeignKeyData(true)

			// TODO - Fix the type casting here. This is a hack to get around the fact that the callback is not typed correctly
			return callback(value, this.primaryKey as any)
		}, from)
		return destroyer
	}
}

export function _data<DataType extends Record<string, any>>(
	instance: () => PlexusInstance,
	collection: () => PlexusCollectionInstance<DataType>,
	primaryKey: string,
	keyValue: string,
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
