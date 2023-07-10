import { AlmostAnything, LiteralType, TypeOrReturnType } from '@plexusjs/utils'
import { Watchable } from './watchable'
import { FunctionType, _action } from './action'
import { PlexusCollectionConfig, _collection } from './collection/collection'
import { _computed } from './computed'
import { _event } from './event'
import {
	getPlexusMasterInstance,
	instance,
	PlexusInstance,
} from './instance/instance'
import { PlexusPreActionConfig, _preaction } from './preaction'
import { _state } from './state'
import { Fetcher, PlexusValidStateTypes } from './types'

export interface PlexusScopeConfig {}

type PlexusScopeStore<CoreType = any> = {
	// getInstance: () => PlexusInstance
	_init?: CoreType
}

/**
 * Create a new PlexusJS plugin
 */
export class Scope {
	// private _internalStore: PlexusScopeStore
	public instance: () => PlexusInstance

	constructor(public name: string, config?: PlexusScopeConfig) {
		if (!name || name.length === 0) {
			throw new Error('Scope name is required')
		}
		// ensure the init function is defined

		if (!config) {
			console.warn('No init function provided for Scope', name)
			throw new Error('No init function provided for Scope')
		}
		// if the scope is not already registered, register it
		this.instance = () => instance({ id: name })
	}

	kill() {
		getPlexusMasterInstance().killScope(this.name)
	}

	/**
	 * Generate a Plexus State
	 * @param item The default value to use when we generate the state
	 * @returns A Plexus State Instance
	 */
	state<
		Override extends PlexusValidStateTypes = never,
		Value = Override extends AlmostAnything ? Override : any
	>(item: Value) {
		return _state(this.instance, item)
	}

	/**
	 * Generate a Plexus State
	 * @param item The default value to use when we generate the state
	 * @returns A Plexus State Instance
	 */
	computed<
		Override extends PlexusValidStateTypes = never,
		Value extends PlexusValidStateTypes = Override extends AlmostAnything
			? Override
			: any
	>(
		item: (value?: Value) => Value,
		dependencies: Array<Watchable<any>> | Watchable<any>
	) {
		if (!Array.isArray(dependencies)) {
			return _computed(this.instance, item, [dependencies])
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

export function scope(name: string, config?: PlexusScopeConfig): Scope
export function scope(name: string, config: PlexusScopeConfig = {}): Scope {
	return new Scope(name, config)
}
