import { instance } from './instance'
import { PlexusInstance } from './instance'
import { WatchableMutable, Watchable } from './watchable'
import { _state, PlexusStateInstance, PlexusStateType } from './state'
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
import { PlexusPlugin, PlexusPluginConfig } from './plugin'
import { PlexusPreActionConfig, _preaction } from './preaction'

/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function state<Value extends PlexusStateType = any>(item: Value) {
  return _state(() => instance(), item)
}
/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function computed<Value extends PlexusStateType = any>(
  item: (value?: Value) => Value,
  dependencies: Array<WatchableMutable<any>> | WatchableMutable<any>
) {
  if (!Array.isArray(dependencies)) {
    return _computed(() => instance(), item, [dependencies])
  }
  return _computed(() => instance(), item, dependencies)
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

export function usePlugin(instance: PlexusInstance, plugin: PlexusPlugin): void
export function usePlugin(instanceId: string, plugin: PlexusPlugin): void
export function usePlugin(
  instanceOrInstanceId: PlexusInstance | string,
  plugin: PlexusPlugin
) {
  if (typeof instanceOrInstanceId === 'string') {
    plugin.init((name?: string) => instance({ instanceId: name }))
  }
  instance()._plugins.set(plugin.name, plugin)
}

// export { api, PlexusApi, PlexusApiConfig, PlexusApiRes } from "./api"
export * from './api'
export { gql } from './gql'

export {
  instance,
  PlexusAction,
  PlexusPlugin,
  PlexusActionHooks,
  PlexusPluginConfig,
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
