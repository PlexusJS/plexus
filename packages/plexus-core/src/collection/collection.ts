import { PlexusWatchableValueInterpreter } from '@plexusjs/utils'
import { PlexusInstance, instance } from '../instance/instance'
import { PlexusInternalWatcher } from '../types'

import { _data, PlexusDataInstance, DataKey, CollectionData } from './data'
import {
	_group,
	PlexusCollectionGroup,
	PlexusCollectionGroupConfig,
	GroupName,
} from './group'
import { PlexusCollectionSelector, SelectorName, _selector } from './selector'

type GroupMap<DataType extends Record<string, any>> = Map<
	GroupName,
	PlexusCollectionGroup<DataType>
>
type SelectorMap<DataType extends Record<string, any>> = Map<
	SelectorName,
	PlexusCollectionSelector<DataType>
>
type KeyOfMap<T extends ReadonlyMap<unknown, unknown>> = T extends ReadonlyMap<
	infer K,
	unknown
>
	? K
	: never

export type ForeignKeyData<DataType> = Partial<
	Record<
		keyof DataType,
		{
			newKey: string
			reference: string
			// @default 'object'
			mode?: 'object' | 'array'
		}
	>
>

export { PlexusCollectionGroup, PlexusCollectionSelector }
export interface PlexusCollectionConfig<DataType> {
	/**
	 * The primary key of of the data items in the collection
	 */
	primaryKey?: string
	/**
	 * The name (or key) of the collection
	 */
	name?: string
	/**
	 * Create a group called "default"
	 */
	defaultGroup?: string | boolean
	/**
	 * When this value is true, using getValue will return undefined rather than an object with only the key. When using get item, you receive a provisional data instance with a value of undefined.
	 * @warning The type of the returned value WILL NOT change to undefined. Only the literal value will be undefined as this is _technically_ an override. Please beware and plan accordingly.
	 * @deprecated This is now the default behavior. Use unfoundKeyReturnsProvisional instead
	 */
	unfoundKeyReturnsUndefined?: boolean
	/**
	 * When this value is true, using getVallue will return a provisional data instance containing just the key instead of undefined. When using get item, you receive a provisional data instance with a value containing the primaryKey only instead of undefined.
	 */
	unfoundKeyReturnsProvisional?: boolean
	/**
	 * When this value is true, the collection will use batching when running operations (like collections) on array to reduce the number of rerenders. This is useful when you are ingesting a large amount of data at once.
	 * @default true
	 */
	useBatching?: boolean

	foreignKeys?: ForeignKeyData<DataType>
	computeLocations?: Array<'collect' | 'getValue'>
	sort?: (a: DataType, b: DataType) => number
}
interface PlexusCollectionStore<DataType extends Record<string, any>> {
	_internalId: string
	_lastChanged: string
	_lookup: Map<string, string>
	_key: string
	_data: Map<string, PlexusDataInstance<DataType>>
	_groups: GroupMap<DataType>
	_selectors: SelectorMap<DataType>
	_name: string
	_externalName: string
	set externalName(value: string)
	_persist: boolean
	_internalCalledGroupCollect?: boolean
	set persist(value: boolean)
	_computeFn?: (
		data: PlexusWatchableValueInterpreter<DataType>
	) => PlexusWatchableValueInterpreter<DataType>
	sort?: (a: DataType, b: DataType) => number
}

export type PlexusCollectionInstance<
	DataType extends Record<string, any> = Record<string, any>,
	Groups extends GroupMap<DataType> = GroupMap<DataType>,
	Selectors extends SelectorMap<DataType> = SelectorMap<DataType>
> = CollectionInstance<DataType, Groups, Selectors>
/**
 * A Collection Instance
 *
 */
export class CollectionInstance<
	DataTypeInput extends Record<string, any>,
	Groups extends GroupMap<DataTypeInput>,
	Selectors extends SelectorMap<DataTypeInput>
	// ForeignRefs extends boolean = this['config']['foreignKeys'] extends {} ? true : false
> {
	private _internalStore: PlexusCollectionStore<DataTypeInput>
	private instance: () => PlexusInstance
	/**
	 * Get the config
	 */
	config: PlexusCollectionConfig<DataTypeInput>
	/**
	 * The internal ID of the collection
	 * @type {string}
	 */
	get id(): string {
		return `${this._internalStore._internalId}`
	}
	/**
	 * The internal id of the collection with an instance prefix
	 * @type {string}
	 */
	get instanceId(): string {
		// return this._internalStore._internalId
		return `coll_${this._internalStore._internalId}`
	}
	constructor(
		instance: () => PlexusInstance,
		config: PlexusCollectionConfig<DataTypeInput> = {
			primaryKey: 'id',
			defaultGroup: false,
		} as const
	) {
		this.instance = instance
		this.config = {
			computeLocations: ['collect', 'getValue'],
			useBatching: true,
			...config,
			foreignKeys: config.foreignKeys || {},
		}
		this._internalStore = {
			_internalId:
				Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15),
			_lookup: new Map<string, string>(),
			_lastChanged: '',
			_key: config?.primaryKey || 'id',
			_data: new Map<string, PlexusDataInstance<DataTypeInput>>(),
			_groups: new Map<
				GroupName,
				PlexusCollectionGroup<DataTypeInput>
			>() as Groups,
			_selectors: new Map<
				SelectorName,
				PlexusCollectionSelector<DataTypeInput>
			>() as Selectors,
			_name: config?.name || '',
			_externalName: '',
			set externalName(value: string) {
				this._externalName = value
			},
			_persist: false,

			set persist(value: boolean) {
				this._persist = value
			},
			sort: config.sort,
		}
		this.mount()

		if (config.defaultGroup) {
			// this ensured default shows up as a group name option
			return this.createGroup(
				typeof config.defaultGroup === 'string'
					? config.defaultGroup
					: 'default'
			)
		}
	}
	/**
	 * Helper function; Checks to see if the provided name is a group name
	 * @param {string} name The name to check
	 * @returns {boolean} if the name is a specific name of a group
	 * @private
	 */
	private isCreatedGroup(name: string): name is KeyOfMap<Groups> {
		return this._internalStore._groups.has(name)
	}
	/**
	 * Helper function; Checks to see if the provided name is a selector name
	 * @param {string} name The name to check
	 * @returns {boolean} if the name is a specific name of a selector
	 * @private
	 */
	private isCreatedSelector(name: string): name is KeyOfMap<Selectors> {
		return this._internalStore._selectors.has(name)
	}
	private mount() {
		if (!this.instance()._collections.has(this)) {
			this.instance()._collections.add(this)
			this.instance().runtime.log(
				'debug',
				`Hoisting collection ${this.instanceId} to instance`
			)
			if (this._internalStore.persist) {
				this.instance().storage?.sync()
			}
		}
	}
	/**
	 * Collect An item of data (or many items of data using an array) into the collection.
	 * @requires: Each data item must have the primary key as a property
	 * @param {DataTypeInput[]|DataTypeInput} data  The data to collect
	 * @param {string | string[]} groups The groups to add the items to
	 * @returns {this} The collection instance
	 */
	collect(
		data:
			| PlexusWatchableValueInterpreter<DataTypeInput>[]
			| PlexusWatchableValueInterpreter<DataTypeInput>,
		groups?: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	): this
	collect(
		data: PlexusWatchableValueInterpreter<DataTypeInput>,
		groups?: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	): this
	collect(
		data: PlexusWatchableValueInterpreter<DataTypeInput>[],
		groups?: GroupName[] | GroupName
	): this
	collect(
		data: PlexusWatchableValueInterpreter<DataTypeInput>,
		groups?: GroupName[] | GroupName
	): this
	collect(
		data:
			| PlexusWatchableValueInterpreter<DataTypeInput>
			| PlexusWatchableValueInterpreter<DataTypeInput>[],
		groups?: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	) {
		const collectItems = (
			items: PlexusWatchableValueInterpreter<DataTypeInput>[] = []
		) => {
			if (!items.length) return []
			const addedKeys = new Set<string>()
			for (let item of items) {
				if (
					item[this._internalStore._key] !== undefined &&
					item[this._internalStore._key] !== null
				) {
					// Compute item before setting/storing
					if (
						typeof this._internalStore._computeFn === 'function' &&
						this.config.computeLocations?.includes('collect')
					) {
						item = this._internalStore._computeFn(item)
					}
					// normalizing the key type to string
					const dataKey = `${item[this._internalStore._key]}`
					// if there is already a state for that key, update it
					if (this.has(dataKey, true)) {
						this._internalStore._data.get(dataKey)?.set(item)
					}
					// if there is no data instance for that key, create it
					else {
						this.instance().runtime.log(
							'debug',
							`Couldn't find data instance for key ${dataKey} in collection ${this.instanceId}; creating a new data instance...`
						)
						const dataInstance = _data(
							() => this.instance(),
							() => this,
							this._internalStore._key,
							dataKey,
							{ ...item, [this._internalStore._key]: dataKey }
						)
						// if we get a valid data instance, add it to the collection
						if (dataInstance) {
							this._internalStore._data.set(dataKey, dataInstance)
						}
					}
					// add the key to the addedKeys set
					addedKeys.add(dataKey)
				}
			}
			return Array.from(addedKeys.values())
		}
		const collectFn = (
			data_: typeof data,
			groups?: KeyOfMap<Groups>[] | KeyOfMap<Groups>,
			startedFromInnerBatch?: boolean
		) => {
			// if the instance is batching and this collection has batching enabled, add this action to the batchedSetters
			if (
				this.instance().runtime.isBatching &&
				this.config.useBatching &&
				!startedFromInnerBatch
			) {
				this.instance().runtime.log(
					'debug',
					`Batching an collect call for collection ${this.instanceId}`
				)
				// store this in the batchedSetters for execution once batching is over
				this.instance().runtime.batchedCalls.push(() => {
					this.instance().runtime.log(
						'debug',
						`Batched collect call fulfilled for collection ${this.instanceId}`
					)
					return collectFn(data_, groups, true)
				})
				return this
			}

			const addedKeys: any[] = collectItems(
				Array.isArray(data_) ? data_ : [data_]
			)

			const defaultGroupName =
				typeof this.config.defaultGroup === 'string'
					? this.config.defaultGroup
					: 'default'
			// if a group (or groups) is provided, add the item to the group
			if (groups) {
				const groupsNorm = Array.isArray(groups) ? groups : [groups]
				this._internalStore._internalCalledGroupCollect = true
				this.addToGroups(
					addedKeys,
					groupsNorm.filter((name) => name !== defaultGroupName)
				)
			}
			if (this.config.defaultGroup) {
				this._internalStore._internalCalledGroupCollect = true
				// if it is not (undefined or some other string), add to group
				this.addToGroups(addedKeys, defaultGroupName as any)
			}
			this._internalStore._internalCalledGroupCollect = false
		}
		// we only need to call back if the instance is not batching
		if (this.config.useBatching) {
			this.instance().runtime.batch(() => collectFn(data, groups))
		} else {
			collectFn(data, groups)
		}
		this.mount()
		return this
	}
	/**
	 * Update the collection with data;
	 * This is like collect but will not add new items, and can can be used to patch existing items
	 * @param {string|number} key The key of the item to update
	 * @param {DataTypeInput} data The data to update the item with
	 * @param config The configuration to use for the update
	 * @param {boolean} config.deep Should the update be deep or shallow
	 */
	update(
		key: DataKey,
		data: Partial<PlexusWatchableValueInterpreter<DataTypeInput>>,
		config: { deep: boolean } = { deep: true }
	) {
		key = `${key}`
		if (this.has(key, true)) {
			if (config.deep) {
				this._internalStore._data.get(key)?.patch({
					...data,
					[this._internalStore._key]: key,
				} as Partial<PlexusWatchableValueInterpreter<DataTypeInput>>)
			} else {
				if (this.has(key, true)) {
					this._internalStore._data
						.get(key)
						?.set(data as PlexusWatchableValueInterpreter<DataTypeInput>)
				} else {
					console.warn('no data found for key', key)
				}
			}
		} else {
			console.warn('no data found for key', key)
		}
		this.mount()
		return this
	}
	/**
	 * Check if the collection has a data item with the given key
	 * @param {string} dataKey The key of the data item to  look for
	 * @param {boolean} includeProvisional Whether to include provisional data items in the search. This may be useful if you are using a collection to store data that is not yet available
	 * @returns {boolean} Whether the collection has a data item with the given key
	 */
	has(dataKey: DataKey, includeProvisional?: boolean): boolean {
		const key = `${dataKey}`
		const secondCondition = includeProvisional
			? true
			: !this.getItem(key)?.provisional
		return this._internalStore._data.has(key) && secondCondition
	}
	/**
	 * Get the Value of the data item with the provided key (the raw data). If there is not an existing data item, this will return a _provisional_ one
	 * @param {string} dataKey The key of the data item to get
	 * @returns {this} The new Collection Instance
	 */
	getItem(dataKey: DataKey): CollectionData<DataTypeInput> {
		dataKey = `${dataKey}`
		const data = this._internalStore._data.get(dataKey)
		if (!data) {
			const dataInstance = _data(
				() => this.instance(),
				() => this,
				this._internalStore._key,
				dataKey,
				!this.config.unfoundKeyReturnsProvisional
					? (undefined as any as DataTypeInput)
					: ({
							[this._internalStore._key]: dataKey,
					  } as any as DataTypeInput),
				{
					prov: true,
					unfoundKeyIsUndefined: !this.config.unfoundKeyReturnsProvisional,
				}
			)
			// if we get an invalid data instance, return undefined
			if (!dataInstance) {
				this.instance().runtime.log(
					'warn',
					`Invalid data instance returned for key ${dataKey} in collection ${this.instanceId}`
				)
				return undefined as any
			}
			// if we get a valid data instance, add it to the collection
			this._internalStore._data.set(dataKey, dataInstance)
			return dataInstance
		}
		// this.mount()
		return data
	}
	/**
	 * Get the value of an item in the collection
	 * @param {string} key The key of the item to get
	 * @returns {DataTypeInput} The value of the item
	 */
	getItemValue(
		key: DataKey
	): PlexusWatchableValueInterpreter<DataTypeInput> | undefined {
		const value = this.getItem(key)?.value
		if (
			typeof this._internalStore._computeFn === 'function' &&
			this.config.computeLocations?.includes('getValue') &&
			value
		)
			return this._internalStore._computeFn(value)
		return value
	}

	/// SELECTORS
	/**
	 * Create a Selector instance for a given selector name
	 * @param {string} selectorName The name of the selector
	 * @param {string} defaultPk The default primaryKey to select
	 * @returns {this} The new Collection Instance
	 */
	createSelector<Name extends SelectorName>(
		selectorName: Name,
		defaultPk?: string
	) {
		if (this._internalStore._selectors.has(selectorName)) return this
		if (selectorName.length === 0) return this
		this._internalStore._selectors.set(
			selectorName,
			_selector(
				() => this.instance(),
				() => this,
				selectorName
			)
		)
		if (defaultPk) {
			this._internalStore._selectors.get(selectorName)?.select(defaultPk)
		}
		this.mount()
		return this as CollectionInstance<
			DataTypeInput,
			Groups,
			Selectors & Map<Name, PlexusCollectionSelector<DataTypeInput>>
		>
	}
	/**
	 * Create Selector instances for a given set of selector names
	 * @param selectorNames {Array<string>} The names of the selectors to create
	 * @returns {this} The new Collection Instance
	 */
	createSelectors<Names extends SelectorName>(
		selectorNames: [Names, ...Names[]]
	) {
		for (const selectorName of selectorNames) {
			this.createSelector(selectorName)
		}
		return this as CollectionInstance<
			DataTypeInput,
			Groups,
			Selectors &
				Map<
					(typeof selectorNames)[number],
					PlexusCollectionSelector<DataTypeInput>
				>
		>
	}
	/**
	 * Get A Selector instance of a given selector name
	 * @param name {string} The Selector Name to search for
	 * @returns {this|undefined} Either a Selector Instance or undefined
	 */
	getSelector(name: string): PlexusCollectionSelector<DataTypeInput>
	getSelector(
		name: KeyOfMap<Selectors>
	): PlexusCollectionSelector<DataTypeInput>
	getSelector(name: KeyOfMap<Selectors> | string) {
		const selector = this._internalStore._selectors.get(name)
		if (this.isCreatedSelector(name) && selector) {
			return selector
		} else {
			const s = _selector<DataTypeInput>(
				() => this.instance(),
				() => this,
				name
			)
			this._internalStore._selectors.set(name as SelectorName, s)
			return s
		}
	}

	/// GROUPS
	/**
	 * Create a group with a name and a configuration
	 * @param groupName {string} The name of the group
	 * @param config {PlexusCollectionGroupConfig}
	 * @returns {this} The new Collection Instance
	 */
	createGroup<Name extends GroupName>(
		groupName: Name,
		config?: PlexusCollectionGroupConfig<DataTypeInput>
	) {
		this.mount()
		if (this._internalStore._groups.has(groupName)) return this
		if (groupName.length === 0) return this
		this._internalStore._groups.set(
			groupName,
			_group(
				() => this.instance(),
				() => this,
				groupName,
				{ ...config, sort: config?.sort || this._internalStore.sort }
			)
		)

		return this as CollectionInstance<
			DataTypeInput,
			Groups & Map<Name, PlexusCollectionGroup<DataTypeInput>>,
			Selectors
		>
	}

	/**
	 * Create multiple groups with a name (no configuration)
	 * @param {string[]} groupNamesThe names of the groups to create
	 * @returns {this} The new Collection Instance
	 */
	createGroups<Names extends GroupName>(
		groupNames: [Names, ...Names[]],
		config?: PlexusCollectionGroupConfig<DataTypeInput>
	) {
		for (const groupName of groupNames) {
			this.createGroup(groupName, config)
		}

		return this as CollectionInstance<
			DataTypeInput,
			Groups &
				Map<(typeof groupNames)[number], PlexusCollectionGroup<DataTypeInput>>,
			Selectors
		>
	}
	/**
	 * Get A Group instance of a given group name
	 * @param {string} name The Group Name to search for
	 * @returns {this} The new Collection Instance
	 */
	getGroup(name: GroupName): PlexusCollectionGroup<DataTypeInput>
	getGroup(name: KeyOfMap<Groups>): PlexusCollectionGroup<DataTypeInput>
	getGroup(name: KeyOfMap<Groups> | GroupName) {
		if (this.isCreatedGroup(name)) {
			const group = this._internalStore._groups.get(
				name
			) as PlexusCollectionGroup<DataTypeInput>

			return group
		} else {
			this.instance().runtime.log(
				'warn',
				`Group ${this.instanceId} failed to find group ${name}; creating placeholder group.`
			)
			const g = _group(
				() => this.instance(),
				() => this,
				name,
				{ sort: this._internalStore.sort }
			)
			this._internalStore._groups.set(name as GroupName, g)
			return g
		}
	}
	/**
	 * Given a key, get all Group names that the key is in
	 * @param {string|number} key The data key(s) to use for lookup
	 * @returns {string[]} An array of Group names that the key is in
	 */
	getGroupsOf(key: DataKey) {
		const inGroups: KeyOfMap<Groups>[] = []
		for (let group of this._internalStore._groups) {
			if (group[1].has(key)) {
				inGroups.push(group[0] as KeyOfMap<Groups>)
			}
		}
		return inGroups
	}
	/**
	 * Add a data item to a group or groups
	 * @param {string} key The key of the item to add
	 * @param {string[]|string} groups The group(s) to add the item to
	 * @returns {this} The new Collection Instance
	 */
	addToGroups(keys: DataKey | DataKey[], groups: GroupName[] | GroupName): this
	addToGroups(
		keys: DataKey | DataKey[],
		groups: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	): this
	addToGroups(
		keys: DataKey | DataKey[],
		groups: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	): this {
		const addToGroup = (
			keys: DataKey[],
			group: GroupName,
			startedFromInnerBatch?: boolean
		) => {
			// if the instance is batching and this collection has batching enabled, add this action to the batchedSetters
			if (
				this.instance().runtime.isBatching &&
				this.config.useBatching &&
				!startedFromInnerBatch
			) {
				this.instance().runtime.log(
					'debug',
					`Collection Batching started for addToGroups`
				)
				// store this in the batchedSetters for execution once batching is over
				this.instance().runtime.batchedCalls.push(() => {
					this.instance().runtime.log(
						'debug',
						`Collection Batching completed for addToGroups`
					)
					return addToGroup(keys, group, true)
				})
				return this
			}
			let g = this.getGroup(group as GroupName)
			// if the group does not exist, create it. This should technically never happen because of getGroup, but leaving here for redundancy
			// ! 08/03 - commenting out to see if we can remove this safely
			// if (!g) {
			// 	g = _group(
			// 		() => this.instance(),
			// 		() => this,
			// 		group,
			// 		{ sort: this._internalStore.sort }
			// 	)
			// 	this._internalStore._groups.set(group as GroupName, g)
			// }
			g.add(keys)
		}
		const parseAndPushGroups = () => {
			// normalize the keys to an array
			const keyArray = Array.isArray(keys) ? keys : [keys]
			if (Array.isArray(groups)) {
				for (let group of groups) {
					addToGroup(keyArray, group)
				}
			} else {
				addToGroup(keyArray, groups)
			}
		}

		if (
			this.config.useBatching &&
			!this._internalStore._internalCalledGroupCollect
		) {
			this.instance().runtime.batch(parseAndPushGroups)
		} else {
			parseAndPushGroups()
		}
		return this
	}
	/**
	 * A shortcut to watch a group for changes
	 * @param name The name of the group you are watching
	 * @param callback The callback to run when the group data changes
	 * @returns {function} A function to stop watching the group
	 */
	watchGroup(
		name: KeyOfMap<Groups>,
		callback: PlexusInternalWatcher<DataTypeInput[]>
	)
	watchGroup(name: string, callback: PlexusInternalWatcher<DataTypeInput[]>)
	watchGroup(
		name: KeyOfMap<Groups> | string,
		callback: PlexusInternalWatcher<DataTypeInput[]>
	) {
		const group = this.getGroup(name)
		if (this.isCreatedGroup(name) && group) {
			return group.watch(callback)
		} else {
			// TODO Replace with runtime log
			this.instance().runtime.log(
				'warn',
				`Group ${name} not found when trying to watch via collection shorthand.`
			)
			return () => {}
		}
	}
	/**
	 * Delete a data item completely from the collection.
	 * @param {string} keys The data key(s) to use for lookup
	 * @returns {this} The new Collection Instance
	 */
	delete(keys: DataKey | DataKey[]): this {
		// the function to remove the data
		const rm = (key: DataKey) => {
			// key = this.config.keyTransform(key)
			key = `${key}`
			this._internalStore._data.get(key)?.clean()

			for (let groupName of this.getGroupsOf(key)) {
				this._internalStore._groups.get(groupName)?.remove(key)
			}
			this._internalStore._data.delete(key)
		}
		// if an array, iterate through the keys and remove them each
		if (Array.isArray(keys)) {
			keys.forEach(rm)
		} else {
			rm(keys)
		}
		this.mount()
		return this
	}
	/**
	 * Remove a data item from a set of groups
	 * @param {string | string[]} keys The data key(s) to use for lookup
	 * @param {string[]|string} groups Either a single group or an array of groups to remove the data from
	 * @returns {this} The new Collection Instance
	 */
	removeFromGroup(
		keys: DataKey | DataKey[],
		groups: KeyOfMap<Groups> | KeyOfMap<Groups>[]
	): this {
		this.mount()
		const rm = (key) => {
			key = `${key}`
			if (Array.isArray(groups)) {
				for (let groupName of groups) {
					if (this.isCreatedGroup(groupName)) {
						this._internalStore._groups.get(groupName)?.remove(key)
					}
				}
			} else if (typeof groups === 'string') {
				if (this.isCreatedGroup(groups)) {
					this._internalStore._groups.get(groups)?.remove(key)
				}
				// for (let groupName of this.getGroupsOf(key)) {
				// }
			}
		}

		// if an array, iterate through the keys and remove them from each associated group
		if (Array.isArray(keys)) {
			keys.forEach(rm)
		} else {
			rm(keys)
		}
		return this
		// ! This is commented out because the user may still want to keep the data in the collection. If they want to completely delete the data, they should use `.delete()`
		// if it's removed from all groups, delete the data entirely
		// if(this.getGroupsOf(key).length === 0){
		//   this.delete(key)
		// }
	}
	/**
	 * Delete all data in the collection
	 * @param {string} groupNames - (Optional) Either an array or a single group name to clear data from
	 * @returns {this} The new Collection Instance
	 */
	clear(groupNames?: KeyOfMap<Groups> | KeyOfMap<Groups>[]): this {
		// this means we want to clear a group, not the whole collection
		if (groupNames) {
			if (Array.isArray(groupNames)) {
				groupNames.forEach(
					(groupName) =>
						this.isCreatedGroup(groupName) && this.getGroup(groupName).clear()
				)
			} else {
				this.isCreatedGroup(groupNames) && this.getGroup(groupNames).clear()
			}
		} else {
			this.delete(Array.from(this._internalStore._data.keys()))
		}
		return this
	}

	/**
	 * Run this function when data is collected to format it in a particular way; useful for converting one datatype into another
	 * @param {function(Object): Object} fn A function that takes in the data and returns the formatted data
	 * @returns {this} The new Collection Instance
	 */
	compute(
		fn: (
			value: PlexusWatchableValueInterpreter<DataTypeInput>
		) => PlexusWatchableValueInterpreter<DataTypeInput>
	): this {
		this._internalStore._computeFn = fn
		return this
	}
	/**
	 * Re-runs the compute function on select IDs (or all the collection if none provided)
	 * @param {string[]|Number[]} ids The data key(s) to use for lookup
	 * @returns {this} The new Collection Instance
	 */
	reCompute(ids?: string | string[]): this {
		if (typeof this._internalStore._computeFn !== 'function') {
			this.instance().runtime.log(
				'warn',
				`Collection ${
					this.name || this.instanceId
				} attempted to recompute without a compute fn set`
			)
			return this
		}

		if (ids) {
			if (!Array.isArray(ids)) ids = [ids as string]
		} else ids = this.keys.map((v) => v.toString())

		ids.forEach((id) => {
			const data = this._internalStore._data.get(id)
			if (data) {
				data.patch({
					...(this._internalStore._computeFn?.(data.value) ?? {}),
					[this._internalStore._key]: id,
				} as Partial<PlexusWatchableValueInterpreter<DataTypeInput>>)
			}
		})
		return this
	}
	/**
	 * Same as reCompute, but for groups
	 * @param {string[]|string} groupNames The data key(s) to use for lookup
	 * @returns {this} The new Collection Instance
	 */
	reComputeGroups(groupNames: KeyOfMap<Groups> | KeyOfMap<Groups>[]): this {
		if (!Array.isArray(groupNames)) groupNames = [groupNames]
		groupNames.forEach((groupName) =>
			this.reCompute(
				this.getGroup(groupName).value.map((d) => d[this._internalStore._key])
			)
		)
		return this
	}
	/**
	 * Set the key of the collection for enhanced internal tracking
	 * @param {string} key The key to use for the collection
	 * @returns {this} The new Collection Instance
	 * @deprecated
	 */
	key(key: string): this {
		this._internalStore._name = key
		this.mount()
		return this
	}
	/**
	 * Get all of the collection data values as an array
	 * @type {DataTypeInput[]}
	 */
	get value(): (DataTypeInput & { [key: string]: any })[] {
		this.mount()
		const values: (DataTypeInput & { [key: string]: any })[] = []
		for (let item of this._internalStore._data.values()) {
			if (!item.provisional) {
				values.push(item.value)
			}
		}
		return this._internalStore.sort &&
			typeof this._internalStore.sort === 'function'
			? values.sort(this._internalStore.sort)
			: values
	}
	/**
	 * Get all of the collection data keys as an array
	 * @type {string[]}
	 */
	get keys() {
		const keys: string[] = []
		for (let item of this._internalStore._data.values()) {
			if (!item.provisional) {
				keys.push(item.key)
			}
		}
		return keys
	}
	/**
	 * Get all the groups in the collection as an object
	 * @type {Record<string, GroupInstance>}
	 */
	get groups() {
		const groups: Record<
			KeyOfMap<Groups>,
			PlexusCollectionGroup<DataTypeInput>
		> = {} as Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataTypeInput>>
		for (let group of this._internalStore._groups.entries()) {
			groups[group[0] as KeyOfMap<Groups>] = group[1]
		}
		return groups
	}
	/**
	 * Get all the groups and their children's data values as an object
	 * @type {Record<GroupNames, DataTypeInput[]>}
	 */
	get groupsValue() {
		// holder for groups values
		const groups: Record<KeyOfMap<Groups>, DataTypeInput[]> = {} as Record<
			KeyOfMap<Groups>,
			DataTypeInput[]
		>

		// iterate through the groups
		const groupNames: KeyOfMap<Groups>[] = Array.from(
			this._internalStore._groups.keys()
		) as KeyOfMap<Groups>[]
		groupNames.forEach(
			(name: KeyOfMap<Groups>) =>
				(groups[name as KeyOfMap<Groups>] = [
					...this.getGroup(name as KeyOfMap<Groups>).value,
				])
		)
		return groups
	}
	/**
	 * Get all the selectors in the collection as an object
	 * @type {Record<SelectorNames, PlexusCollectionSelector>}
	 */
	get selectors() {
		const selectors: Record<
			KeyOfMap<Selectors>,
			PlexusCollectionSelector<DataTypeInput>
		> = {} as Record<
			KeyOfMap<Selectors>,
			PlexusCollectionSelector<DataTypeInput>
		>
		for (let selector of this._internalStore._selectors.entries()) {
			selectors[selector[0]] = selector[1]
		}
		return selectors
	}
	/**
	 * Get all the groups and their children's data values as an object
	 * @type {Record<SelectorNames, DataTypeInput[]>}
	 */
	get selectorsValue() {
		const selectors = {} as Record<
			KeyOfMap<Selectors>,
			PlexusWatchableValueInterpreter<DataTypeInput>
		>
		for (let selector of this._internalStore._selectors.entries()) {
			if (selector[1].value)
				selectors[selector[0] as KeyOfMap<Selectors>] = selector[1].value
		}
		return selectors
	}
	/**
	 * Get the name (generated or custom) of the collection store
	 * @type {string}
	 */
	get name() {
		return this._internalStore._name
	}
	/**
	 * Set the name of the collection for enhanced internal tracking
	 * @param {string} name The key to use for the collection
	 */
	set name(name: string) {
		this._internalStore._name = name
		this.mount()
	}

	set lastUpdatedKey(value: string) {
		this._internalStore._lastChanged = value
	}

	/**
	 * Get the last updated key of the collection
	 * @type {string}
	 */
	get lastUpdatedKey() {
		return this._internalStore._lastChanged
	}

	/**
	 * Get the size of the collection (the number of data items in the collection))
	 * @type {number}
	 */
	get size() {
		// should we remove provisional items from the count? If so this is a prototype of how to do it
		// return this._internalStore._data.size - this._internalStore._provisionalCount
		return this._internalStore._data.size
	}
}
export function _collection<
	DataType extends { [key: string]: any },
	Groups extends GroupMap<DataType> = GroupMap<DataType>,
	Selectors extends SelectorMap<DataType> = SelectorMap<DataType>
>(
	instance: () => PlexusInstance,
	_config: PlexusCollectionConfig<DataType> = { primaryKey: 'id' } as const
) {
	/**
	 * Helper Function; Mounts the collection to the instance
	 */

	const collection = new CollectionInstance<DataType, Groups, Selectors>(
		instance,
		_config
	)
	return collection
}

/**
 * Create a new Collection Instance
 * @param config The configuration for the collection
 * @returns A collection Instance
 */
export function collection<Type extends { [key: string]: any }>(
	config?: PlexusCollectionConfig<Type>
) {
	return _collection<Type>(() => instance(), config)
}
