// import { PlexusInstance, PxStateType } from '../interfaces';

import { group } from "console"
import { PlexusStateInstance, state } from ".."
import { PlexusInstance } from "../instance"
import { PlexusStateWatcher } from "../state"
import { _data, PlexusDataInstance, DataKey } from "./data"
import { _group, PlexusCollectionGroup, PlexusCollectionGroupConfig, GroupName } from "./group"
import { PlexusCollectionSelector, SelectorName, _selector } from "./selector"

type GroupMap<DataType> = Map<GroupName, PlexusCollectionGroup<DataType>>
type SelectorMap<DataType> = Map<SelectorName, PlexusCollectionSelector<DataType>>
type KeyOfMap<T extends ReadonlyMap<unknown, unknown>> = T extends ReadonlyMap<infer K, unknown> ? K : never

export { PlexusCollectionGroup, PlexusCollectionSelector }
export interface PlexusCollectionConfig<DataType> {
	primaryKey?: string;
}

/**
 * A Collection Instance
 */
export interface PlexusCollectionInstance<
	DataType = any,
	Groups extends GroupMap<DataType> = GroupMap<DataType>,
	Selectors extends SelectorMap<DataType> = SelectorMap<DataType>
> {
	/**
	 * Collect An item of data (or many items of data using an array) into the collection.
	 * @requires: Each data item must have the primary key as a property
	 * @param data Object[] | Object ::
	 * @param groups string | string[] :: The groups to add the items to
	 */
	collect(data: DataType[], groups?: string[] | string): void
	collect(data: DataType, groups?: string[] | string): void
	/**
	 * GEt the
	 * @param key
	 * @returns
	 */
	getItem(key: DataKey): PlexusDataInstance<DataType>
	/**
	 * Get the value of an item in the collection
	 * @param key The key of the item to get
	 * @returns The value of the item
	 */
	getItemValue(key: DataKey): DataType
	/**
	 * Create a group with a name and a configuration
	 * @param groupName The name of the group
	 * @param config
	 * @returns The new Collection Instance
	 */
	createGroup<Name extends GroupName>(
		groupName: Name,
		config?: PlexusCollectionGroupConfig<DataType>
	): this & PlexusCollectionInstance<DataType, Map<Name, PlexusCollectionGroup<DataType>>, Selectors>
	/**
	 * Create multiple groups with a name (no configuration)
	 * @param groupNames The names of the groups to create
	 * @returns The new Collection Instance
	 */
	createGroups<Name extends GroupName>(
		groupNames: Name[]
	): this & PlexusCollectionInstance<DataType, Map<Name, PlexusCollectionGroup<DataType>>, Selectors>
	/**
	 * Get A Group instance of a given group name
	 * @param name The Group Name to search for
	 * @returns Group Instance
	 */
	getGroup(name: string): PlexusCollectionGroup<DataType>
	getGroup(name: KeyOfMap<Groups>): PlexusCollectionGroup<DataType>
	/**
	 * Add a data item to a group or groups
	 * @param key The key of the item to add
	 * @param groups The group(s) to add the item to
	 */
	addToGroups(key: DataKey, groups: GroupName[] | GroupName): void
	/**
	 * Given a key, get all Group names that the key is in
	 * @param key The data key(s) to use for lookup
	 * @returns The Group names that the key is in
	 */
	getGroupsOf(key: DataKey): Array<KeyOfMap<Groups>>
	watchGroup(name: string, callback: PlexusStateWatcher<DataType[]>): void | (() => void)
	watchGroup(name: KeyOfMap<Groups>, callback: PlexusStateWatcher<DataType[]>): () => void
	/**
	 * Create a Selector instance for a given selector name
	 * @param name The name of the selector
	 * @returns The new Collection Instance
	 */
	createSelector<SelectorName extends GroupName>(
		name: SelectorName
	): this & PlexusCollectionInstance<DataType, Groups, Map<SelectorName, PlexusCollectionSelector<DataType>>>
	/**
	 * Create Selector instances for a given set of selector names
	 * @param names The names of the selectors to create
	 * @returns The new Collection Instance
	 */
	createSelectors<SelectorName extends GroupName>(
		names: SelectorName[]
	): this & PlexusCollectionInstance<DataType, Groups, Map<SelectorName, PlexusCollectionSelector<DataType>>>

	/**
	 * Get A Group instance of a given group name
	 * @param name The Group Name to search for
	 * @returns Either a Group Instance or undefined
	 */
	getSelector(name: string): undefined | PlexusCollectionSelector<DataType>
	getSelector(name: KeyOfMap<Selectors>): PlexusCollectionSelector<DataType>

	/**
	 * Update the collection with data;
	 * This is like collect but will not add new items, and can can be used to patch existing items
	 * @param key The key of the item to update
	 * @param data The data to update the item with
	 * @param config The configuration to use for the update
	 * @param config.deep Should the update be deep or shallow
	 */
	update(key: DataKey, data: Partial<DataType>, config?: { deep: boolean }): void
	/**
	 * Delete a data item completely from the collection.
	 * @param keys The data key(s) to use for lookup
	 */
	delete(keys: DataKey | DataKey[]): void
	/**
	 * Remove a data item from a set of groups
	 * @param keys The data key(s) to use for lookup
	 * @param groups Either a single group or an array of gorups to remove the data from
	 */
	remove(keys: DataKey | DataKey[], groups: KeyOfMap<Groups>[] | KeyOfMap<Groups>): void
	/**
	 * Delete all data in the collection
	 */
	clear(): void
	/**
	 * Get all of the collection data values as an array
	 * @returns The collection data values as an array
	 */
	get value(): DataType[]
	/**
	 * Get all the groups in the collection as an object
	 * @returns The groups in the collection
	 */
	get groups():
		| Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>>
		| Record<string, PlexusCollectionGroup<DataType>>
	/**
	 * Get all the groups and their childrens data values as an object
	 * @returns The groups paired with their childrens data values as an object
	 */
	get groupsValue(): Record<KeyOfMap<Groups>, DataType[]>
	/**
	 * Get all the groups in the collection as an object
	 * @returns The groups in the collection
	 */
	get selectors():
		| Record<KeyOfMap<Selectors>, PlexusCollectionSelector<DataType>>
		| Record<string, PlexusCollectionSelector<DataType>>
	/**
	 * Get all the groups and their childrens data values as an object
	 * @returns The groups paired with their childrens data values as an object
	 */
	get selectorsValue(): Record<KeyOfMap<Selectors>, DataType>
	/**
	 * Get the name (generated or custom) of the collection store
	 */
	get name (): string;
	/**
	 * Get the config
	 */
	get config (): PlexusCollectionConfig<DataType>;
}

export function _collection<
	DataType extends { [key: string]: any },
	Groups extends GroupMap<DataType> = GroupMap<DataType>,
	Selectors extends SelectorMap<DataType> = SelectorMap<DataType>
>(instance: () => PlexusInstance, _config: PlexusCollectionConfig<DataType> = { primaryKey: "id" } as const) {
	const _internalStore = {
		_lookup: new Map<string, string>(),
		_key: _config?.primaryKey || "id",
		_data: new Map<DataKey, PlexusDataInstance<DataType>>(),
		_groups: new Map<GroupName, PlexusCollectionGroup<DataType>>() as Groups,
		_selectors: new Map<SelectorName, PlexusCollectionSelector<DataType>>() as Selectors,
		_name: `_plexus_collection_${instance().genNonce()}`,
		_externalName: "",
		set externalName(value: string) {
			this._externalName = value
		},
		_persist: false,

		set persist(value: boolean) {
			this._persist = value
		},
	}

	/**
	 * Helper function; Checks to see if the provided name is a group name
	 * @param name The name to check
	 * @returns boolean: if the name is a specific name of a group
	 */
	const isCreatedGroup = (name: string): name is KeyOfMap<Groups> => {
		return _internalStore._groups.has(name)
	}
	/**
	 * Helper function; Checks to see if the provided name is a selector name
	 * @param name The name to check
	 * @returns boolean: if the name is a specific name of a selector
	 */
	const isCreatedSelector = (name: string): name is KeyOfMap<Selectors> => {
		return _internalStore._selectors.has(name)
	}

	const collection: PlexusCollectionInstance<DataType, Groups> = {
		collect(data: DataType | DataType[], groups?: GroupName[] | GroupName) {
			if (Array.isArray(data)) {
				for (let item of data) {
					if (item[_internalStore._key] !== undefined && item[_internalStore._key] !== null) {
						// if there is already a state for that key, update it
						if (_internalStore._data.has(item[_internalStore._key])) {
							_internalStore._data.get(item[_internalStore._key]).set(item)
						}
						// if there is no state for that key, create it
						else {
							const datainstance = _data(() => instance(), _internalStore._key, item)
							if (datainstance) {
								_internalStore._data.set(item[_internalStore._key], datainstance)
							}
						}
						this.addToGroups(item[_internalStore._key], groups)
					}
				}
			} else {
				if (data[_internalStore._key] !== undefined && data[_internalStore._key] !== null) {
					// if there is already a state for that key, update it
					if (_internalStore._data.has(data[_internalStore._key])) {
						_internalStore._data.get(data[_internalStore._key]).set(data)
					}
					// if there is no state for that key, create it
					else {
						const datainstance = _data(() => instance(), _internalStore._key, data)
						if (datainstance) {
							_internalStore._data.set(data[_internalStore._key], datainstance)
						}
					}
					this.addToGroups(data[_internalStore._key], groups)
				}
			}
		},

		update(key: DataKey, data: Partial<DataType>, config: { deep: boolean } = { deep: true }) {
			if (config.deep) {
				if (_internalStore._data.has(key)) {
					_internalStore._data
						.get(key)
						.set({ ...data, [_internalStore._key]: key } as DataType, { mode: "patch" })
				} else {
					console.warn("no data found for key", key)
				}
			} else {
				if (_internalStore._data.has(key)) {
					_internalStore._data.get(key).set(data as DataType, { mode: "replace" })
				} else {
					console.warn("no data found for key", key)
				}
			}
		},

		getItem(key: DataKey) {
			return _internalStore._data.get(key)
		},

		getItemValue(key: DataKey) {
			return this.getItem(key).value
		},

		/// SELECTORS
		createSelector(selectorName: string) {
			_internalStore._selectors.set(
				selectorName,
				_selector(() => instance(), _internalStore._name, selectorName)
			)
			return this as any
		},
		createSelectors(selectorNames: string[]) {
			for (const selectorName of selectorNames) {
				_internalStore._selectors.set(
					selectorName,
					_selector(() => instance(), _internalStore._name, selectorName)
				)
			}
			return this as any
		},
		getSelector(name: KeyOfMap<Selectors> | string) {
			if (isCreatedSelector(name)) {
				return _internalStore._selectors.get(name)
			} else {
				return undefined
			}
		},

		/// GROUPS
		createGroup<Name extends GroupName>(groupName: Name, config?: PlexusCollectionGroupConfig<DataType>) {
			_internalStore._groups.set(
				groupName,
				_group(() => instance(), _internalStore._name, groupName, config)
			)
			// TODO: Fix this type issue
			// need to return any as it throws a type error with the getGroup function
			return this as any
		},
		createGroups<Name extends GroupName>(groupNames: Name[]) {
			for (const groupName of groupNames) {
				_internalStore._groups.set(
					groupName,
					_group(() => instance(), _internalStore._name, groupName)
				)
			}
			// TODO: Fix this type issue
			// need to return any as it throws a type error with the getGroup function
			return this as any
		},
		getGroup(name: KeyOfMap<Groups> | string) {
			if (isCreatedGroup(name)) {
				return _internalStore._groups.get(name)
			} else {
				const g = _group(() => instance(), _internalStore._name, name)
				_internalStore._groups.set(name as GroupName, g)
				return g
			}
		},
		getGroupsOf(key: DataKey) {
			const inGroups: KeyOfMap<Groups>[] = []
			for (let group of _internalStore._groups) {
				if (group[1].has(key)) {
					inGroups.push(group[0] as KeyOfMap<Groups>)
				}
			}
			return inGroups
		},

		addToGroups(key: DataKey, groups: GroupName[] | GroupName) {
			if (groups) {
				if (Array.isArray(groups)) {
					for (let group in groups) {
						let g = _internalStore._groups.get(group as GroupName)
						if (!g) {
							g = _group(() => instance(), _internalStore._name, group)
							_internalStore._groups.set(group as GroupName, g)
						}
						g.add(key)
					}
				} else {
					let g = _internalStore._groups.get(groups as GroupName)
					if (!g) {
						g = _group(() => instance(), _internalStore._name, groups)
						_internalStore._groups.set(groups as GroupName, g)
					}
					g.add(key)
				}
			}
		},
		watchGroup(name: KeyOfMap<Groups> | string, callback: PlexusStateWatcher<DataType[]>) {
			if (isCreatedGroup(name)) {
				return _internalStore._groups.get(name).watch(callback)
			} else {
				console.warn("no group found for name", name)
			}
		},

		delete(keys: DataKey | DataKey[]) {
			const rm = (key) => {
				_internalStore._data.get(key).delete()

				for (let groupName of this.getGroupsOf(key)) {
					_internalStore._groups.get(groupName).remove(key)
				}
				_internalStore._data.delete(key)
			}
			if (Array.isArray(keys)) {
				keys.forEach(rm)
			} else {
				rm(keys)
			}
		},

		remove(keys: DataKey | DataKey[], groups: KeyOfMap<Groups> | KeyOfMap<Groups>[]) {
			const rm = (key) => {
				if (Array.isArray(groups)) {
					for (let groupName of this.getGroupsOf(key)) {
						_internalStore._groups.get(groupName).remove(key)
					}
				}
			}
			if (Array.isArray(keys)) {
				keys.forEach(rm)
			} else {
				rm(keys)
			}
			// if it's removed from all groups, delete the data entirely
			// if(this.getGroupsOf(key).length === 0){
			//   this.delete(key)
			// }
		},

		clear() {
			this.delete(Array.from(_internalStore._data.keys()))
		},
		get value() {
			return Array.from(_internalStore._data.values()).map((item) => item.value)
		},
		get groups() {
			const groups: Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>> = {} as Record<
				KeyOfMap<Groups>,
				PlexusCollectionGroup<DataType>
			>
			for (let group of _internalStore._groups.entries()) {
				groups[group[0] as KeyOfMap<Groups>] = group[1]
			}
			return groups
		},
		get groupsValue() {
			const groups: Record<KeyOfMap<Groups>, DataType[]> = {} as Record<KeyOfMap<Groups>, DataType[]>
			for (let group of _internalStore._groups.entries()) {
				groups[group[0] as KeyOfMap<Groups>] = Array.from(group[1].index).map(
					(key) => _internalStore._data.get(key).value
				)
			}
			return groups
		},
		get selectors() {
			const selectors: Record<KeyOfMap<Selectors>, PlexusCollectionSelector<DataType>> = {} as Record<
				KeyOfMap<Selectors>,
				PlexusCollectionSelector<DataType>
			>
			for (let selector of _internalStore._selectors.entries()) {
				selectors[selector[0]] = selector[1]
			}
			return selectors
		},
		get selectorsValue() {
			const selectors: Record<KeyOfMap<Selectors>, DataType> = {} as Record<KeyOfMap<Selectors>, DataType>
			for (let selector of _internalStore._selectors.entries()) {
				selectors[selector[0] as KeyOfMap<Selectors>] = selector[1].value
			}
			return selectors
		},
		get name () {
			return _internalStore._name;
		},
		get config () {
			return _config;
		}
	}

	// initalization //
	if (instance()._collections.has(_internalStore._name + "")) {
		instance()._collections.delete(_internalStore._name + "")
	}

	instance()._collections.set(_internalStore._name + "", collection)
	return collection
}
