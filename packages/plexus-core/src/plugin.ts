import { instance, PlexusInstance } from './instance'
import { Scope } from './scope'
import { WatchableMutable, Watchable } from './watchable'

type PlexusPluginStore<CoreType = any> = {
	// getInstance: () => PlexusInstance
	_init?: CoreType
}

export type PlexusPlugin = {
	name: string
	version?: string
	init: (
		instance?: (name?: string) => PlexusInstance
	) => Record<string, Watchable | string | WatchableMutable[]> | void
}

export interface PlexusPluginConfig {
	newInstance?: boolean
	version?: string
}
type PlexusPluginConstructor<
	T extends Record<string, Watchable | string | Watchable[]> = Record<
		string,
		Watchable | string | Watchable[]
	>
> = (instance: () => PlexusInstance) => T | void

/**
 * Create a new PlexusJS plugin
 */
export class Plugin {
	private _internalStore: PlexusPluginStore
	public scope: Scope

	constructor(
		name: string,
		configOrInit: PlexusPluginConfig | PlexusPluginConstructor,
		init?: PlexusPluginConstructor
	) {
		if (!name || name.length === 0) {
			throw new Error('Plugin name is required')
		}
		// ensure the init function is defined
		if (typeof configOrInit === 'function') {
			init = configOrInit
			configOrInit = {
				version: '1.0.0',
				newInstance: false,
			}
		}
		if (!init) {
			console.warn('No init function provided for plugin', name)
			throw new Error('No init function provided for plugin')
		}
		// if the plugin is not already registered, register it
		this.scope = new Scope(name)
		this._internalStore = {
			_init: init(this.scope.instance),
		}
	}

	get core() {
		// TODO: figure out when to recompute the plugin's core (ex. `this._internalStore.getInstance()`)
		return {
			...this._internalStore._init,
		}
	}
}
export function createPlexusPlugin(
	name: string,
	init: PlexusPluginConstructor
): Plugin
export function createPlexusPlugin<InitFn extends PlexusPluginConstructor>(
	name: string,
	configOrInit: PlexusPluginConfig | InitFn,
	init?: InitFn
): Plugin {
	return new Plugin(name, configOrInit, init)
}

/**
 *
 * Could have something like:
 * const MY_PLUGIN = createPlexusPlugin('myPlugin', (instance) => {
 * return {}
 * })
 * state('initial Value', MY_PLUGIN.instance)
 *
 * OR
 * MY_PLUGIN.state('initial Value')
 *
 * OR
 * MY_PLUGIN.(state, 'initial Value')
 *
 * OR
 * MY_PLUGIN.define(state, 'initial Value', { name: 'myState' })
 */
