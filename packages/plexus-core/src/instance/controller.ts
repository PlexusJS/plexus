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
/**
 * Plexus Controller can be used to create a controller for a module within your plexus core.
 * Pass an object that can be many layers deep. Each key is the name of a plexus item (state, action, etc) and the value is the instance of the item.
 */
export class ControllerInstance<
	OriginalObject extends Record<string, PlexusItem>
> {
	public readonly name: string
	public readonly path: string
	public readonly instance: () => PlexusInstance
	protected readonly moduleStore: Record<string, PlexusItem> = {}
	private linkedIds: Map<string, string[]> = new Map()

	constructor(
		instance: () => PlexusInstance,
		name: string,
		data: OriginalObject
	) {
		this.name = name
		this.path = name
		this.instance = instance
		this.moduleStore = data
		this.create(data)
	}
	/**
	 * Intake data, get the object id's, link them to the name, assign the names to the instance in the key's value, and save the mapping to the controller
	 * @param data
	 */
	create(data: OriginalObject) {
		const names = Object.keys(data)
		const mapping = names.map<[string, string[]]>((name) => {
			const item = data[name]
			const id = item.id
			if (!id) {
				throw new Error(
					`Plexus Controller: ${this.name} - ${name} is missing an id`
				)
			}
			if (item?.name) {
				item.name = name
			}
			return [name, [id]]
		})
		this.linkedIds = new Map(mapping)
	}
	export() {
		return this.moduleStore as OriginalObject
	}
	get module() {
		return this.moduleStore as OriginalObject
	}
}
export function controller<OriginalObject extends Record<string, PlexusItem>>(
	data: OriginalObject
) {
	return new ControllerInstance(() => instance(), instance().genId(), data)
}
