import { instance } from "./instance";
import { PlexusInstance, PlexusPlugin } from "./interfaces";
interface PlexusPluginConfig {
	newInstance?: boolean
	version?: string,
}
type PlexusPluginConstructor<T=any> = (instance: () => PlexusInstance) => T;
export function plexusPlugin(name: string, init: PlexusPluginConstructor);
export function plexusPlugin(name: string, configOrInit?: PlexusPluginConfig | (PlexusPluginConstructor), init?: PlexusPluginConstructor) {
	const  _internalStore = {
		getInstance: null
	}
	// ensure the init function is defined
	if(typeof configOrInit === 'function'){
		init = configOrInit
		configOrInit = {}
	}
	configOrInit.newInstance === true ? _internalStore.getInstance = () => instance({instanceId: name}) : _internalStore.getInstance = () => instance()

	// if the init function is defined, call it
	
	return init(_internalStore.getInstance)
}