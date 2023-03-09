import { instance } from './instance/instance'
import { PlexusInstance } from './instance/instance'
import { WatchableMutable, Watchable } from './watchable'
import { _state, PlexusStateInstance, StateInstance } from './state'
import { _computed, PlexusComputedStateInstance } from './computed'
import {
	_action,
	FunctionType,
	PlexusAction,
	PlexusActionHooks,
} from './action'
import {
	_collection,
	PlexusCollectionConfig,
	PlexusCollectionInstance,
	PlexusCollectionSelector,
	PlexusCollectionGroup,
} from './collection/collection'
import { _event, PlexusEventInstance } from './event'
import { storage as _storage, StorageOverride } from './storage'
import { PlexusScopeConfig, scope } from './scope'
import { PlexusPlugin, Plugin, createPlexusPlugin } from './plugin'

import { PlexusPreActionConfig, _preaction } from './preaction'
import { LiteralType, AlmostAnything } from '@plexusjs/utils'
import { TypeOrReturnType } from '@plexusjs/utils'
import { Fetcher, PlexusStateType } from './types'

// export function state<
// 	Literal extends PlexusStateType = any,
// 	Value extends PlexusStateType = Literal extends AlmostAnything
// 		? Literal
// 		: TypeOrReturnType<Literal>
// >(item: Fetcher<Value>): TypeOrReturnType<Value>

// export function state<
// 	Literal extends PlexusStateType = any,
// 	Value extends PlexusStateType = Literal extends AlmostAnything
// 		? Literal
// 		: TypeOrReturnType<Literal>
// >(item: Value): StateInstance<Value>
/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function state<
	Literal extends PlexusStateType = any,
	Value extends PlexusStateType = Literal extends AlmostAnything
		? Literal
		: TypeOrReturnType<Literal>
>(item: Fetcher<Value> | Value) {
	return _state<TypeOrReturnType<Value>>(
		() => instance(),
		item as TypeOrReturnType<Value>
	)
}
/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function computed<
	Literal extends PlexusStateType = any,
	Value extends PlexusStateType = Literal extends AlmostAnything
		? Literal
		: TypeOrReturnType<Literal>
>(
	item: (value?: Value) => Value,
	dependencies: Array<Watchable<any>> | Watchable<any>
) {
	if (!Array.isArray(dependencies)) {
		return _computed<Value>(() => instance(), item, [dependencies])
	}
	return _computed<Value>(() => instance(), item, dependencies)
}
/**
 * Create a new Storage Instance
 * @param name The name of the Storage Module
 * @param override The function overrides for the Storage Module, if omitted, defaults to localStorage
 * @returns A storage instance
 */
export function storage(name?: string, override?: StorageOverride) {
	return _storage(() => instance(), name, override)
}
/**
 * Create a new event Engine
 * @returns An Event Instance
 */
export function event<PayloadType = any>() {
	return _event<PayloadType>(() => instance())
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
/**
 * Generate a Plexus Action
 * @param fn The Plexus action function to run
 * @returns The intended return value of fn, or null if an error is caught
 */
export function action<Fn extends FunctionType>(fn: Fn) {
	return _action<Fn>(() => instance(), fn)
}
/**
 * Generate a Plexus Action
 * @param fn The Plexus action function to run
 * @returns The intended return value of fn, or null if an error is caught
 */
export function batchAction<Fn extends FunctionType>(fn: Fn) {
	return _action<Fn>(() => instance(), fn, true)
}
/**
 * Run a function. During that function's execution, any state changes will be batched and only applied once the function has finished.
 * @param fn The function to run in a batch
 */
export function batch<BatchFunction extends () => any | Promise<any> = any>(
	fn: BatchFunction
): ReturnType<BatchFunction> {
	return instance().runtime.batch(fn)
}
/**
 * Generate a Plexus Action
 * @param fn The Plexus action function to run
 * @returns The intended return value of fn, or null if an error is caught
 */
export function preaction<Fn extends FunctionType>(
	fn: Fn,
	config?: PlexusPreActionConfig
) {
	return _preaction<Fn>(() => instance(), fn, config)
}

export function setGlobalCatch(catcher: (err: any) => unknown) {
	instance()._globalCatch = catcher
}

// TODO I don't think this is used or needed anywhere, so I'm not exporting this yet
function setCore<CoreObj = Record<string, any>>(coreObj: CoreObj) {}

export function usePlugin(instance: PlexusInstance, plugin: Plugin): void
export function usePlugin(instanceId: string, plugin: Plugin): void
export function usePlugin(
	instanceOrInstanceId: PlexusInstance | string,
	plugin: Plugin
) {
	// if (typeof instanceOrInstanceId === 'string') {
	// 	plugin.init((name) => instance({ id: name }))
	// }
	// instance()._plugins.set(plugin.name, plugin)
}

// export { api, PlexusApi, PlexusApiConfig, PlexusApiRes } from "./api"
export * from './api'
export { gql } from './gql'

export {
	instance,
	PlexusAction,
	PlexusPlugin,
	PlexusActionHooks,
	PlexusScopeConfig as PlexusPluginConfig,
	scope,
	createPlexusPlugin,
	PlexusCollectionConfig,
	PlexusCollectionInstance,
	PlexusEventInstance,
	PlexusStateInstance,
	PlexusCollectionGroup,
	PlexusCollectionSelector,
	PlexusComputedStateInstance,
	PlexusInstance,
	WatchableMutable as WatchableValue,
	Watchable,
}
