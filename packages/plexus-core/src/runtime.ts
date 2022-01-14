import {EventEmitter} from "./helpers";
import { PlexusInstance, PxStateType } from "./interfaces";
type Fn<Value> = (value: Value) => void
type SubscriptionTypes = 'stateChange' | 'event' | 'storage' | `plugin_${string}`

/**
 * Create a runtime for an instance NOTE: NOT FOR PUBLIC USE
 * @param instance the instance the runtime is running on
 * @returns 
 */
export function _runtime(instance: () => PlexusInstance){
	const _internalStore = {
		_conductor: new EventEmitter<{key: string|number, value: any}>(),
		_watchers: new Map<string|number, Map<string|Number, (v: any) => void>>(),
	}

	const genEventName = (key: string) => `stateChange_${key}`

	// track a change and propigate to all listeneing children in instance
	function stateChange<Value=PxStateType>(key: string | number, value: Value){	
		_internalStore._conductor.emit(`stateChange_${key}`, {key, value})
		_internalStore._conductor.emit(`anyStateChanged`, {key, value})
	}

	function broadcast<Value=PxStateType>(key: string | number, type: SubscriptionTypes, value: Value){
		_internalStore._conductor.emit(`${type}_${key}`, {key, value})
	}

	/**
	 * 
	 * @param _key The key of the object being wathced
	 * @param _callback The function to call when the value changes
	 * @returns A function to remove the watcher
	 */
	// function subscribe<Value=PxStateType>(key: string | number, callback: Fn<Value>);
	function subscribe<Value=PxStateType>(_key: string | number, typeOrCallback: SubscriptionTypes | Fn<Value>, _callback?: Fn<Value>){
		const type = typeof typeOrCallback === 'string' ? typeOrCallback : 'stateChange'
		if(typeof typeOrCallback === 'function' && _callback === undefined){
			_callback = typeOrCallback
		}
		function callback(data: {key: string | number, value: Value}){
			const {key, value} = data

			if(_key === key){
				_callback(value)
			}
		} 

		// 
		const unsub = _internalStore._conductor.on(`${type}_${_key}`, callback)
		// generate watcher key
		// watcherKey = watcherKey === undefined ? `_plexus_state_watcher_${instance().genNonce()}` : watcherKey


		// if that watcher list does not already exist, create it
		// if(!_internalStore._watchers.has(_key)){
		// 	_internalStore._watchers.set(_key, new Map<string|Number, (v: any) => void>())
		// }
		// // add the watcher to the list
		// _internalStore._watchers.get(_key).set(watcherKey, _callback)

		// return the watcher unsubscribe function
		return unsub
	}

	function unsubscribe(key: string|number, watcherKey: string | number){
		// if the parent key does not exist, fail silently
		// if(!_internalStore._watchers.has(key)){return}
		// const callback = _internalStore._watchers.get(key).get(watcherKey)
		// _internalStore._conductor.removeListener('stateChange', callback)
		// _internalStore._watchers.get(key).delete(watcherKey)
	}

	function getWatchers(key?: string | number){
		if(!key) return _internalStore._conductor.events
		return _internalStore._conductor.events.get(`stateChange_${key}`)
	}

	function log(type: 'warn' | 'info' | 'error', message: string){
		const typeColors = {
			'info': '#4281A4',
			'warn': '#E9D985',
			'error': '#CE2D4F'
		}
		console[type](`%cPlexus(${instance().name}) ${type.toUpperCase()}:%c ${message}`, `color: ${typeColors[type]};`, 'color: unset;')
	}
	
	return {
		stateChange,
		broadcast,
		subscribe,
		unsubscribe,
		getWatchers,
		log
	}
}