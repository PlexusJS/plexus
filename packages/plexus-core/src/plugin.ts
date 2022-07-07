import { instance, PlexusInstance } from "./instance"
// import { PlexusInstance } from "./interfaces";
export type PlexusPlugin = {
	name: string
	version?: string
	init: (instance?: (name?: string) => PlexusInstance) => void
}

export interface PlexusPluginConfig {
	newInstance?: boolean
	version?: string
}
type PlexusPluginConstructor<T = any> = (instance: () => PlexusInstance) => T
export function plexusPlugin(name: string, init: PlexusPluginConstructor)
export function plexusPlugin(name: string, configOrInit?: PlexusPluginConfig | PlexusPluginConstructor, init?: PlexusPluginConstructor) {
	const _internalStore = {
		getInstance: null as null | (() => PlexusInstance),
	}
	// ensure the init function is defined
	if (typeof configOrInit === "function") {
		init = configOrInit
		configOrInit = {
			version: "0.0.0",
			newInstance: false,
		}
	}
	if (!init) {
		console.warn("No init function provided for plugin", name)
		return
	}
	_internalStore.getInstance = configOrInit?.newInstance === true ? () => instance({ instanceId: name }) : () => instance()

	// call the plugin initializer
	return init(_internalStore.getInstance)
}
