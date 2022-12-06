import { PlexusInstance } from '../instance'
import { PlexusWatcher } from '../interfaces'

import { _data, PlexusDataInstance, DataKey } from './data'
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
	 */
	unfoundKeyReturnsUndefined?: boolean

	foreignKeys?: ForeignKeyData<DataType>
	computeLocations?: Array<'collect' | 'getValue'>
}
interface PlexusCollectionStore<
	DataType extends Record<string, any>,
	Groups,
	Selectors
> {
	_internalId: string
	_lastChanged: number | string
	_lookup: Map<string, string>
	_key: string
	_data: Map<string | number, PlexusDataInstance<DataType>>
	_groups: GroupMap<DataType>
	_selectors: SelectorMap<DataType>
	_name: string
	_externalName: string
	set externalName(value: string)
	_persist: boolean
	set persist(value: boolean)
	_computeFn?: (data: DataType) => DataType
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
	DataType extends Record<string, any>,
	Groups extends GroupMap<DataType>,
	Selectors extends SelectorMap<DataType>
	// ForeignRefs extends boolean = this['config']['foreignKeys'] extends {} ? true : false
> {
	private _internalStore: PlexusCollectionStore<DataType, Groups, Selectors>
	private instance: () => PlexusInstance
	/**
	 * Get the config
	 */
	config: PlexusCollectionConfig<DataType>
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
		config: PlexusCollectionConfig<DataType> = {
			primaryKey: 'id',
			defaultGroup: false,
		} as const
	) {
		this.instance = instance
		this.config = {
			computeLocations: ['collect', 'getValue'],
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
			_data: new Map<string, PlexusDataInstance<DataType>>(),
			_groups: new Map<GroupName, PlexusCollectionGroup<DataType>>() as Groups,
			_selectors: new Map<
				SelectorName,
				PlexusCollectionSelector<DataType>
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
				'info',
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
	 * @param {DataType[]|DataType} data  The data to collect
	 * @param {string | string[]} groups The groups to add the items to
	 * @returns {this} The collection instance
	 */
	collect(
		data: DataType[],
		groups?: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	): void
	collect(data: DataType, groups?: KeyOfMap<Groups>[] | KeyOfMap<Groups>): void
	collect(data: DataType[], groups?: GroupName[] | GroupName): void
	collect(data: DataType, groups?: GroupName[] | GroupName): void
	collect(
		data: DataType | DataType[],
		groups?: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	) {
		const collectItem = (item: DataType) => {
			if (!item) return
			if (
				item[this._internalStore._key] !== undefined &&
				item[this._internalStore._key] !== null
			) {
				// Compute item before setting/storing
				if (
					typeof this._internalStore._computeFn === 'function' &&
					this.config.computeLocations?.includes('collect')
				)
					item = this._internalStore._computeFn(item)
				// normalizing the key type to string
				const dataKey = item[this._internalStore._key]
				// if there is already a state for that key, update it
				if (this._internalStore._data.has(dataKey)) {
					this._internalStore._data.get(dataKey)?.set(item)
				}
				// if there is no data instance for that key, create it
				else {
					const dataInstance = _data(
						() => this.instance(),
						() => this,
						this._internalStore._key,
						dataKey,
						item
					)
					// if we get a valid data instance, add it to the collection
					if (dataInstance) {
						this._internalStore._data.set(dataKey, dataInstance)
					}
				}
				const defaultGroupName =
					typeof this.config.defaultGroup === 'string'
						? this.config.defaultGroup
						: 'default'
				// if a group (or groups) is provided, add the item to the group
				if (groups) {
					const groupsNorm = Array.isArray(groups) ? groups : [groups]
					this.addToGroups(
						dataKey,
						groupsNorm.filter((name) => name !== defaultGroupName)
					)
				}
				if (this.config.defaultGroup) {
					// if it is not (undefined or some other string), add to group
					this.addToGroups(dataKey, defaultGroupName as any)
				}
			}
		}
		if (Array.isArray(data)) {
			for (let item of data) {
				collectItem(item)
			}
		} else {
			collectItem(data)
		}
		this.mount()
		return this
	}
	/**
	 * Update the collection with data;
	 * This is like collect but will not add new items, and can can be used to patch existing items
	 * @param {string|number} key The key of the item to update
	 * @param {DataType} data The data to update the item with
	 * @param config The configuration to use for the update
	 * @param {boolean} config.deep Should the update be deep or shallow
	 */
	update(
		key: DataKey,
		data: Partial<DataType>,
		config: { deep: boolean } = { deep: true }
	) {
		key = key
		if (config.deep) {
			if (this._internalStore._data.has(key)) {
				this._internalStore._data.get(key)?.patch({
					...data,
					[this._internalStore._key]: key,
				} as Partial<DataType>)
			} else {
				console.warn('no data found for key', key)
			}
		} else {
			if (this._internalStore._data.has(key)) {
				this._internalStore._data.get(key)?.set(data as DataType)
			} else {
				console.warn('no data found for key', key)
			}
		}
		this.mount()
		return this
	}
	/**
	 * Get the Value of the data item with the provided key (the raw data). If there is not an existing data item, this will return a _provisional_ one
	 * @param {string|number} dataKey The key of the data item to get
	 * @returns {this} The new Collection Instance
	 */
	getItem(dataKey: DataKey): PlexusDataInstance<DataType> {
		const data = this._internalStore._data.get(dataKey)
		if (!data) {
			const dataInstance = _data(
				() => this.instance(),
				() => this,
				this._internalStore._key,
				dataKey,
				this.config.unfoundKeyReturnsUndefined
					? (undefined as any as DataType)
					: ({
							[this._internalStore._key]: dataKey,
					  } as any as DataType),
				{
					prov: true,
					unfoundKeyIsUndefined: this.config.unfoundKeyReturnsUndefined,
				}
			)
			// if we get a valid data instance, add it to the collection
			if (dataInstance) {
				this._internalStore._data.set(dataKey, dataInstance)
			}
			return dataInstance as PlexusDataInstance<DataType>
		}
		// this.mount()
		return data
	}
	/**
	 * Get the value of an item in the collection
	 * @param {string|number} key The key of the item to get
	 * @returns {DataType} The value of the item
	 */
	getItemValue(key: DataKey): DataType {
		const value = this.getItem(key).value
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
	 * @returns {this} The new Collection Instance
	 */
	createSelector<Name extends SelectorName>(selectorName: Name) {
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
		this.mount()
		return this as CollectionInstance<
			DataType,
			Groups,
			Selectors & Map<Name, PlexusCollectionSelector<DataType>>
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
			DataType,
			Groups,
			Selectors &
				Map<typeof selectorNames[number], PlexusCollectionSelector<DataType>>
		>
	}
	/**
	 * Get A Selector instance of a given selector name
	 * @param name {string} The Selector Name to search for
	 * @returns {this|undefined} Either a Selector Instance or undefined
	 */
	getSelector(name: string): PlexusCollectionSelector<DataType>
	getSelector(name: KeyOfMap<Selectors>): PlexusCollectionSelector<DataType>
	getSelector(name: KeyOfMap<Selectors> | string) {
		const selector = this._internalStore._selectors.get(name)
		if (this.isCreatedSelector(name) && selector) {
			return selector
		} else {
			const s = _selector<DataType>(
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
		config?: PlexusCollectionGroupConfig<DataType>
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
				config
			)
		)

		return this as CollectionInstance<
			DataType,
			Groups & Map<Name, PlexusCollectionGroup<DataType>>,
			Selectors
		>
	}

	/**
	 * Create multiple groups with a name (no configuration)
	 * @param {string[]} groupNamesThe names of the groups to create
	 * @returns {this} The new Collection Instance
	 */
	createGroups<Names extends GroupName>(groupNames: [Names, ...Names[]]) {
		for (const groupName of groupNames) {
			this.createGroup(groupName)
		}

		return this as CollectionInstance<
			DataType,
			Groups & Map<typeof groupNames[number], PlexusCollectionGroup<DataType>>,
			Selectors
		>
	}
	/**
	 * Get A Group instance of a given group name
	 * @param {string} name The Group Name to search for
	 * @returns {this} The new Collection Instance
	 */
	getGroup(name: string): PlexusCollectionGroup<DataType>
	getGroup(name: KeyOfMap<Groups>): PlexusCollectionGroup<DataType>
	getGroup(name: KeyOfMap<Groups> | string) {
		if (this.isCreatedGroup(name)) {
			const group = this._internalStore._groups.get(
				name
			) as PlexusCollectionGroup<DataType>

			return group
		} else {
			this.instance().runtime.log(
				'warn',
				'Failed to find group %s; creating placeholder group.',
				name
			)
			const g = _group(
				() => this.instance(),
				() => this,
				name
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
	 * @param {string|number} key The key of the item to add
	 * @param {string[]|string} groups The group(s) to add the item to
	 * @returns {this} The new Collection Instance
	 */
	addToGroups(
		key: DataKey,
		groups: KeyOfMap<Groups>[] | KeyOfMap<Groups>
	): this {
		const addToGroup = (group: GroupName) => {
			let g = this.getGroup(group as GroupName)
			// if the group does not exist, create it
			if (!g) {
				g = _group(
					() => this.instance(),
					() => this,
					group
				)
				this._internalStore._groups.set(group as GroupName, g)
			}
			g.add(key)
		}
		if (Array.isArray(groups)) {
			for (let group of groups) {
				addToGroup(group)
			}
		} else {
			addToGroup(groups)
		}

		return this
	}
	watchGroup(name: KeyOfMap<Groups>, callback: PlexusWatcher<DataType[]>)
	watchGroup(name: string, callback: PlexusWatcher<DataType[]>)
	watchGroup(
		name: KeyOfMap<Groups> | string,
		callback: PlexusWatcher<DataType[]>
	) {
		const group = this.getGroup(name)
		if (this.isCreatedGroup(name) && group) {
			return group.watch(callback)
		} else {
			// TODO Replace with runtime log
			console.warn('No group found for name', name)
			return () => {}
		}
	}
	/**
	 * Delete a data item completely from the collection.
	 * @param {string|number} keys The data key(s) to use for lookup
	 * @returns {this} The new Collection Instance
	 */
	delete(keys: DataKey | DataKey[]): this {
		// the function to remove the data
		const rm = (key: DataKey) => {
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
	 * @param {string|number} keys The data key(s) to use for lookup
	 * @param {string[]|string} groups Either a single group or an array of groups to remove the data from
	 * @returns {this} The new Collection Instance
	 */
	removeFromGroup(
		keys: DataKey | DataKey[],
		groups: KeyOfMap<Groups> | KeyOfMap<Groups>[]
	): this {
		this.mount()
		const rm = (key) => {
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
	compute(fn: (value: DataType) => DataType): this {
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
				`Attempted to recompute ${this.name} without a compute fn set`
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
				} as Partial<DataType>)
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
	 */
	key(key: string): this {
		this._internalStore._name = key
		this.mount()
		return this
	}
	/**
	 * Get all of the collection data values as an array
	 * @type {DataType[]}
	 */
	get value(): (DataType & { [key: string]: any })[] {
		this.mount()
		const keys: (DataType & { [key: string]: any })[] = []
		for (let item of this._internalStore._data.values()) {
			if (!item.provisional) {
				keys.push(item.value)
			}
		}
		return keys
	}
	/**
	 * Get all of the collection data keys as an array
	 * @type {string[]|number[]}
	 */
	get keys() {
		const keys: (string | number)[] = []
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
			PlexusCollectionGroup<DataType>
		> = {} as Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>>
		for (let group of this._internalStore._groups.entries()) {
			groups[group[0] as KeyOfMap<Groups>] = group[1]
		}
		return groups
	}
	/**
	 * Get all the groups and their children's data values as an object
	 * @type {Record<GroupNames, DataType[]>}
	 */
	get groupsValue() {
		// holder for groups values
		const groups: Record<KeyOfMap<Groups>, DataType[]> = {} as Record<
			KeyOfMap<Groups>,
			DataType[]
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
			PlexusCollectionSelector<DataType>
		> = {} as Record<KeyOfMap<Selectors>, PlexusCollectionSelector<DataType>>
		for (let selector of this._internalStore._selectors.entries()) {
			selectors[selector[0]] = selector[1]
		}
		return selectors
	}
	/**
	 * Get all the groups and their children's data values as an object
	 * @type {Record<SelectorNames, DataType[]>}
	 */
	get selectorsValue() {
		const selectors: Record<KeyOfMap<Selectors>, DataType> = {} as Record<
			KeyOfMap<Selectors>,
			DataType
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

	set lastUpdatedKey(value: string | number) {
		this._internalStore._lastChanged = value
	}

	/**
	 * Get the last updated key of the collection
	 * @type {string|number}
	 */
	get lastUpdatedKey() {
		return this._internalStore._lastChanged
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
