import { handlePlexusError } from '@plexusjs/utils'
import type { PlexusCollectionInstance } from '../collection/collection'
import type { PlexusComputedStateInstance } from '../computed'
import type { PlexusEventInstance } from '../event'
import type { PlexusStateInstance } from '../state'
import { PlexusInstance, instance } from './instance'

type PlexusItem =
	| PlexusCollectionInstance
	| PlexusEventInstance
	| PlexusStateInstance
	| PlexusComputedStateInstance

type PlexusRecord<T> = {
	[key: string]: T | PlexusItem
}

type PlexusIdMap<T> = {
	[key: string]: T | string
}
type ControllerOptions<OriginalObject = PlexusRecord<any>> = {
	instance: () => PlexusInstance
	id: string
	data: OriginalObject
}
/**
 * Plexus Controller can be used to create a controller for a module within your plexus core.
 * Pass an object that can be many layers deep. Each key is the name of a plexus item (state, action, etc) and the value is the instance of the item.
 */
export class ControllerInstance<OriginalObject extends PlexusRecord<any>> {
	private readonly id: string
	private path: string | null = null
	public readonly instance: () => PlexusInstance
	protected readonly moduleStore: OriginalObject
	private linkedIds: Record<
		string,
		string | ControllerInstance<PlexusRecord<any>>
	> = Object.freeze({})

	constructor(
		public name: string,
		options: ControllerOptions<OriginalObject>
	) {
		const { instance, id, data } = options
		this.id = id
		this.instance = instance
		this.moduleStore = data
		this.create(data)
	}

	static parseModule(data: PlexusRecord<any>) {
		const names = Object.keys(data)
		const values = names.map((name) => this.parseItem(name, data))
		return Object.fromEntries(values)
	}

	static parseItem(name: string, data: PlexusRecord<any>) {
		const item = data[name]
		if (item instanceof ControllerInstance) {
			return [name, item.linkedIds]
		}
		const id: string = item?.id
		if (!id) {
			throw handlePlexusError(`${name} is missing an id`, {
				source: this.name,
			})
		}
		item.name = name
		return [name, id]
	}
	/**
	 * Intake data, get the object id's, link them to the name, assign the names to the instance in the key's value, and save the mapping to the controller
	 * @param data
	 */
	create(data: OriginalObject) {
		const mapping = ControllerInstance.parseModule(data)

		this.linkedIds = Object.freeze({ ...mapping })
	}

	get module() {
		return this.moduleStore as OriginalObject
	}
}
export function controller<OriginalObject extends PlexusRecord<any>>(
	name: string,
	data: OriginalObject
)
export function controller<OriginalObject extends PlexusRecord<any>>(
	data: OriginalObject
)
export function controller<OriginalObject extends PlexusRecord<any>>(
	nameOrData: string | OriginalObject,
	data?: OriginalObject
) {
	const id = instance().genId()
	if (typeof nameOrData === 'string') {
		return new ControllerInstance(nameOrData, {
			instance: () => instance(),
			id,
			data: data || {},
		})
	}
	return new ControllerInstance(id, {
		instance: () => instance(),
		id,
		data: nameOrData,
	})
}
