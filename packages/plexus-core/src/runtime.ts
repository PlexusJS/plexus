import {EventEmitter} from "./helpers";
import { PlexusInstance, PxStateType } from "./interfaces";

export function _runtime(instance: () => PlexusInstance){
	const _internalStore = {
		_conductor: new EventEmitter(),
		_watchers: new Map<string|number, Map<string|Number, (v: any) => void>>()
	}

	// track a change and propigate to all listeneing children in instance
	function stateChange<Value=PxStateType>(key: string | number, value: Value){	
		_internalStore._conductor.emit('stateChange', {key, value})
	}

	/**
	 * 
	 * @param _key The key of the object being wathced
	 * @param _callback The function to call when the value changes
	 */
	function subscribe<Value=PxStateType>(_key: string | number, watcherKey: string | number, _callback: (value: Value) => void){
		const callback = function(data: {key: string | number, value: Value}){
			const {key, value} = data

			if(_key === key){
				_callback(value)
			}
		} 
		const unsub = _internalStore._conductor.on('stateChange', callback)
		// generate watcher key
		watcherKey = watcherKey === undefined ? `_plexus_state_watcher_${instance().genNonce()}` : watcherKey


		// if that watcher list does not already exist, create it
		if(!_internalStore._watchers.has(_key)){
			_internalStore._watchers.set(_key, new Map<string|Number, (v: any) => void>())
		}
		// add the watcher to the list
		_internalStore._watchers.get(_key).set(watcherKey, _callback)

		// return the watcher key
		return watcherKey
	}

	function unsubscribe(key: string|number, watcherKey: string | number){
		// if the parent key does not exist, fail silently
		if(!_internalStore._watchers.has(key)){return}
		const callback = _internalStore._watchers.get(key).get(watcherKey)
		_internalStore._conductor.removeListener('stateChange', callback)
		_internalStore._watchers.get(key).delete(watcherKey)
	}

	function getWatchers(key?: string | number){
		if(!key) return _internalStore
		// return _internalStore._watchers.get(key)
	}
	
	return {
		stateChange,
		subscribe,
		unsubscribe,
		getWatchers,
	}
}