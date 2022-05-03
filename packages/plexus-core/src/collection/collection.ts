import { PlexusInstance } from "../instance"
import { PlexusWatcher } from "../interfaces"

import { _data, PlexusDataInstance, DataKey } from "./data"
import { _group, PlexusCollectionGroup, PlexusCollectionGroupConfig, GroupName } from "./group"
import { PlexusCollectionSelector, SelectorName, _selector } from "./selector"

type GroupMap<DataType> = Map<GroupName, PlexusCollectionGroup<DataType>>
type SelectorMap<DataType> = Map<SelectorName, PlexusCollectionSelector<DataType>>
type KeyOfMap<T extends ReadonlyMap<unknown, unknown>> = T extends ReadonlyMap<infer K, unknown> ? K : never

// type valuesOfArray =

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
}
interface PlexusCollectionStore<DataType, Groups, Selectors> {
	_internalId: string
	_lookup: Map<string, string>
	_key: string
	_data: Map<string | number, PlexusDataInstance<DataType>>
	_groups: Map<GroupName, PlexusCollectionGroup<DataType>>
	_selectors: Map<SelectorName, PlexusCollectionSelector<DataType>>
	_name: string
	_externalName: string
	set externalName(value: string)
	_persist: boolean
	set persist(value: boolean)
}

export type PlexusCollectionInstance<
	DataType = Record<string, any>,
	Groups extends GroupMap<DataType> = GroupMap<DataType>,
	Selectors extends SelectorMap<DataType> = SelectorMap<DataType>
> = CollectionInstance<DataType, Groups, Selectors>
/**
 * @description A Collection Instance
 */
export class CollectionInstance<DataType, Groups extends GroupMap<DataType>, Selectors extends SelectorMap<DataType>> {
	private _internalStore: PlexusCollectionStore<DataType, Groups, Selectors>
	private instance: () => PlexusInstance
	/**
	 * Get the config
	 */
	config: PlexusCollectionConfig<DataType>
	/**
	 * The internal ID of the collection
	 */
	id: string

	constructor(instance: () => PlexusInstance, _config: PlexusCollectionConfig<DataType> = { primaryKey: "id" } as const) {
		this.instance = instance
		this.config = _config
		this._internalStore = {
			_internalId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
			_lookup: new Map<string, string>(),
			_key: _config?.primaryKey || "id",
			_data: new Map<string, PlexusDataInstance<DataType>>(),
			_groups: new Map<GroupName, PlexusCollectionGroup<DataType>>() as Groups,
			_selectors: new Map<SelectorName, PlexusCollectionSelector<DataType>>() as Selectors,
			_name: _config?.name || "",
			_externalName: "",
			set externalName(value: string) {
				this._externalName = value
			},
			_persist: false,

			set persist(value: boolean) {
				this._persist = value
			},
		}
		this.id = this._internalStore._internalId
	}
	/**
	 * Helper function; Checks to see if the provided name is a group name
	 * @param name The name to check
	 * @returns boolean: if the name is a specific name of a group
	 */
	private isCreatedGroup(name: string): name is KeyOfMap<Groups> {
		return this._internalStore._groups.has(name)
	}
	/**
	 * Helper function; Checks to see if the provided name is a selector name
	 * @param name The name to check
	 * @returns boolean: if the name is a specific name of a selector
	 */
	private isCreatedSelector(name: string): name is KeyOfMap<Selectors> {
		return this._internalStore._selectors.has(name)
	}
	private mount() {
		if (!this.instance()._collections.has(this)) {
			this.instance().runtime.log("info", `Hoisting collection ${this.id} to instance`)
			this.instance()._collections.add(this)
			this.instance().storage?.sync()
		}
	}
	/**
	 * Collect An item of data (or many items of data using an array) into the collection.
	 * @requires: Each data item must have the primary key as a property
	 * @param data Object[] | Object ::
	 * @param groups string | string[] :: The groups to add the items to
	 */
	collect(data: DataType[], groups?: GroupName[] | GroupName): void
	collect(data: DataType, groups?: GroupName[] | GroupName): void
	collect(data: DataType | DataType[], groups?: GroupName[] | GroupName) {
		const collectItem = (item: DataType) => {
			if (!item) return
			if (item[this._internalStore._key] !== undefined && item[this._internalStore._key] !== null) {
				// normalizing the key type to string
				const dataKey = item[this._internalStore._key]
				// if there is already a state for that key, update it
				if (this._internalStore._data.has(dataKey)) {
					this._internalStore._data.get(dataKey)?.set(item)
				}
				// if there is no state for that key, create it
				else {
					const datainstance = _data(() => this.instance(), this._internalStore._key, item)
					if (datainstance) {
						this._internalStore._data.set(dataKey, datainstance)
					}
				}
				if (groups) this.addToGroups(item[this._internalStore._key], groups)
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
	}
	/**
	 * Update the collection with data;
	 * This is like collect but will not add new items, and can can be used to patch existing items
	 * @param key The key of the item to update
	 * @param data The data to update the item with
	 * @param config The configuration to use for the update
	 * @param config.deep Should the update be deep or shallow
	 */
	update(key: DataKey, data: Partial<DataType>, config: { deep: boolean } = { deep: true }) {
		key = key
		if (config.deep) {
			if (this._internalStore._data.has(key)) {
				this._internalStore._data.get(key)?.set({ ...data, [this._internalStore._key]: key } as Partial<DataType>, { mode: "patch" })
			} else {
				console.warn("no data found for key", key)
			}
		} else {
			if (this._internalStore._data.has(key)) {
				this._internalStore._data.get(key)?.set(data as DataType, { mode: "replace" })
			} else {
				console.warn("no data found for key", key)
			}
		}
		this.mount()
	}
	/**
	 * Get the Value of the data item with the provided key (the raw data).
	 * @param key
	 * @returns
	 */
	getItem(key: DataKey) {
		return this._internalStore._data.get(key)
	}
	/**
	 * Get the value of an item in the collection
	 * @param key The key of the item to get
	 * @returns The value of the item
	 */
	getItemValue(key: DataKey) {
		return this.getItem(key)?.value
	}

	/// SELECTORS
	/**
	 * Create a Selector instance for a given selector name
	 * @param name The name of the selector
	 * @returns The new Collection Instance
	 */
	createSelector<Name extends SelectorName>(selectorName: Name) {
		this._internalStore._selectors.set(
			selectorName,
			_selector(
				() => this.instance(),
				() => this,
				selectorName
			)
		)
		return this as CollectionInstance<DataType, Groups, Selectors & Map<Name, PlexusCollectionSelector<DataType>>>
	}
	/**
	 * Create Selector instances for a given set of selector names
	 * @param names The names of the selectors to create
	 * @returns The new Collection Instance
	 */
	createSelectors<Names extends SelectorName>(selectorNames: [Names, ...Names[]]) {
		for (const selectorName of selectorNames) {
			this.createSelector(selectorName)
		}
		return this as CollectionInstance<DataType, Groups, Selectors & Map<typeof selectorNames[number], PlexusCollectionSelector<DataType>>>
	}
	/**
	 * Get A Group instance of a given group name
	 * @param name The Group Name to search for
	 * @returns Either a Group Instance or undefined
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
	 * @param groupName The name of the group
	 * @param config
	 * @returns The new Collection Instance
	 */
	createGroup<Name extends GroupName>(groupName: Name, config?: PlexusCollectionGroupConfig<DataType>) {
		this._internalStore._groups.set(
			groupName,
			_group(
				() => this.instance(),
				() => this,
				groupName,
				config
			)
		)

		return this as CollectionInstance<DataType, Groups & Map<Name, PlexusCollectionGroup<DataType>>, Selectors>
	}

	/**
	 * Create multiple groups with a name (no configuration)
	 * @param groupNames The names of the groups to create
	 * @returns The new Collection Instance
	 */
	createGroups<Names extends GroupName>(groupNames: [Names, ...Names[]]) {
		for (const groupName of groupNames) {
			this.createGroup(groupName)
		}

		return this as CollectionInstance<DataType, Groups & Map<typeof groupNames[number], PlexusCollectionGroup<DataType>>, Selectors>
	}
	/**
	 * Get A Group instance of a given group name
	 * @param name The Group Name to search for
	 * @returns Group Instance
	 */
	getGroup(name: string): PlexusCollectionGroup<DataType>
	getGroup(name: KeyOfMap<Groups>): PlexusCollectionGroup<DataType>
	getGroup(name: KeyOfMap<Groups> | string) {
		if (this.isCreatedGroup(name)) {
			const group = this._internalStore._groups.get(name) as PlexusCollectionGroup<DataType>

			return group
		} else {
			this.instance().runtime.log("warn", "Failed to find group %s; creating placeholder group.", name)
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
	 * @param key The data key(s) to use for lookup
	 * @returns The Group names that the key is in
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
	 * @param key The key of the item to add
	 * @param groups The group(s) to add the item to
	 */
	addToGroups(key: DataKey, groups: GroupName[] | GroupName) {
		if (groups) {
			if (Array.isArray(groups)) {
				for (let group in groups) {
					let g = this._internalStore._groups.get(group as GroupName)
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
			} else {
				let g = this._internalStore._groups.get(groups as GroupName)
				if (!g) {
					g = _group(
						() => this.instance(),
						() => this,
						groups
					)
					this._internalStore._groups.set(groups as GroupName, g)
				}
				g.add(key)
			}
		}
	}
	watchGroup(name: KeyOfMap<Groups> | string, callback: PlexusWatcher<DataType[]>) {
		const group = this.getGroup(name)
		if (this.isCreatedGroup(name) && group) {
			return group.watch(callback)
		} else {
			// TODO Replace with runtime log
			console.warn("No group found for name", name)
			return () => {}
		}
	}
	/**
	 * Delete a data item completely from the collection.
	 * @param keys The data key(s) to use for lookup
	 */
	delete(keys: DataKey | DataKey[]) {
		// the function to remove the data
		const rm = (key: DataKey) => {
			key = key
			this._internalStore._data.get(key)?.delete()

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
	}
	/**
	 * Remove a data item from a set of groups
	 * @param keys The data key(s) to use for lookup
	 * @param groups Either a single group or an array of gorups to remove the data from
	 */
	remove(keys: DataKey | DataKey[], groups: KeyOfMap<Groups> | KeyOfMap<Groups>[]) {
		const rm = (key) => {
			if (Array.isArray(groups)) {
				for (let groupName of this.getGroupsOf(key)) {
					this._internalStore._groups.get(groupName)?.remove(key)
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
	}
	/**
	 * Delete all data in the collection
	 */
	clear() {
		this.delete(Array.from(this._internalStore._data.keys()))
	}
	/**
	 * Set the key of the collection for enhanced internal tracking
	 */
	key(key: string) {
		this._internalStore._name = key
		this.mount()
		return this
	}
	/**
	 * Get all of the collection data values as an array
	 * @returns The collection data values as an array
	 */
	get value() {
		this.mount()
		return Array.from(this._internalStore._data.values()).map((item) => item.value)
	}
	/**
	 * Get all the groups in the collection as an object
	 * @returns The groups in the collection
	 */
	get groups() {
		const groups: Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>> = {} as Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>>
		for (let group of this._internalStore._groups.entries()) {
			groups[group[0] as KeyOfMap<Groups>] = group[1]
		}
		return groups
	}
	/**
	 * Get all the groups and their children's data values as an object
	 * @returns The groups paired with their children's data values as an object
	 */
	get groupsValue() {
		// holder for groups values
		const groups: Record<KeyOfMap<Groups>, DataType[]> = {} as Record<KeyOfMap<Groups>, DataType[]>

		// iterate through the groups
		const groupNames: KeyOfMap<Groups>[] = Array.from(this._internalStore._groups.keys()) as KeyOfMap<Groups>[]
		groupNames.forEach((name: KeyOfMap<Groups>) => (groups[name as KeyOfMap<Groups>] = [...this.getGroup(name as KeyOfMap<Groups>).value]))
		return groups
	}
	/**
	 * Get all the groups in the collection as an object
	 * @returns The groups in the collection
	 */
	get selectors() {
		const selectors: Record<KeyOfMap<Selectors>, PlexusCollectionSelector<DataType>> = {} as Record<
			KeyOfMap<Selectors>,
			PlexusCollectionSelector<DataType>
		>
		for (let selector of this._internalStore._selectors.entries()) {
			selectors[selector[0]] = selector[1]
		}
		return selectors
	}
	/**
	 * Get all the groups and their childrens data values as an object
	 * @returns The groups paired with their childrens data values as an object
	 */
	get selectorsValue() {
		const selectors: Record<KeyOfMap<Selectors>, DataType> = {} as Record<KeyOfMap<Selectors>, DataType>
		for (let selector of this._internalStore._selectors.entries()) {
			if (selector[1].value) selectors[selector[0] as KeyOfMap<Selectors>] = selector[1].value
		}
		return selectors
	}
	/**
	 * Get the name (generated or custom) of the collection store
	 */
	get name() {
		return this._internalStore._name
	}
}
export function _collection<
	DataType extends { [key: string]: any },
	Groups extends GroupMap<DataType> = GroupMap<DataType>,
	Selectors extends SelectorMap<DataType> = SelectorMap<DataType>
>(instance: () => PlexusInstance, _config: PlexusCollectionConfig<DataType> = { primaryKey: "id" } as const) {
	/**
	 * Helper Function; Mounts the collection to the instance
	 */

	const collection = new CollectionInstance<DataType, Groups, Selectors>(instance, _config)
	return collection
}
