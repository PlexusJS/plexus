import { AlmostAnything, LiteralType } from '@plexusjs/utils'
import { Watchable } from '.'
import { FunctionType, _action } from './action'
import { PlexusCollectionConfig, _collection } from './collection/collection'
import { _computed } from './computed'
import { _event } from './event'
import { instance, PlexusInstance } from './instance'
import { PlexusPreActionConfig, _preaction } from './preaction'
import { PlexusStateType, _state } from './state'

export type PlexusPlugin = {
	name: string
	version?: string
	init: (
		instance?: (name?: string) => PlexusInstance
	) => Record<string, Watchable | string | Watchable[]> | void
}

export interface PlexusPluginConfig {
	newInstance?: boolean
	version?: string
}

type PlexusPluginStore<CoreType = any> = {
	// getInstance: () => PlexusInstance
	_init?: CoreType
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
	public instance: () => PlexusInstance

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
		this.instance = () => instance({ id: name })
		this._internalStore = {
			_init: init(this.instance),
		}
	}

	get core() {
		// TODO: figure out when to recompute the plugin's core (ex. `this._internalStore.getInstance()`)
		return {
			...this._internalStore._init,
		}
	}

	/**
	 * Generate a Plexus State
	 * @param item The default value to use when we generate the state
	 * @returns A Plexus State Instance
	 */
	state<
		Literal extends PlexusStateType = any,
		Value = Literal extends AlmostAnything ? Literal : LiteralType<Literal>
	>(item: Value) {
		return _state<Value>(this.instance, item)
	}

	/**
	 * Generate a Plexus State
	 * @param item The default value to use when we generate the state
	 * @returns A Plexus State Instance
	 */
	computed<
		Literal extends PlexusStateType = any,
		Value = Literal extends AlmostAnything ? Literal : LiteralType<Literal>
	>(
		item: (value?: Value) => Value,
		dependencies: Array<Watchable<any>> | Watchable<any>
	) {
		if (!Array.isArray(dependencies)) {
			return _computed<Value>(this.instance, item, [dependencies])
		}
		return _computed(this.instance, item, dependencies)
	}
	/**
	 * Create a new event Engine
	 * @returns An Event Instance
	 */
	event<PayloadType = any>() {
		return _event<PayloadType>(this.instance)
	}

	/**
	 * Create a new Collection Instance
	 * @param config The configuration for the collection
	 * @returns A collection Instance
	 */
	collection<Type extends { [key: string]: any }>(
		config?: PlexusCollectionConfig<Type>
	) {
		return _collection<Type>(this.instance, config)
	}
	/**
	 * Generate a Plexus Action
	 * @param fn The Plexus action function to run
	 * @returns The intended return value of fn, or null if an error is caught
	 */
	action<Fn extends FunctionType>(fn: Fn) {
		return _action<Fn>(this.instance, fn)
	}
	/**
	 * Generate a Plexus Action
	 * @param fn The Plexus action function to run
	 * @returns The intended return value of fn, or null if an error is caught
	 */
	batchAction<Fn extends FunctionType>(fn: Fn) {
		return _action<Fn>(this.instance, fn, true)
	}
	/**
	 * Run a function. During that function's execution, any state changes will be batched and only applied once the function has finished.
	 * @param fn The function to run in a batch
	 */
	batch<BatchFunction extends () => any | Promise<any> = any>(
		fn: BatchFunction
	): ReturnType<BatchFunction> {
		return this.instance().runtime.batch(fn)
	}
	/**
	 * Generate a Plexus Action
	 * @param fn The Plexus action function to run
	 * @returns The intended return value of fn, or null if an error is caught
	 */
	preaction<Fn extends FunctionType>(fn: Fn, config?: PlexusPreActionConfig) {
		return _preaction<Fn>(this.instance, fn, config)
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

/**
 * !Considering changing the name from "plugin" to "scope" or "namespace" or "context" or "module"
 */
