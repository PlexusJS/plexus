import {EventEmitter} from "./helpers";
import { PlexusInstance } from "./instance";
import { PlexusStateType } from "./state";
// import { PlexusInstance, PlexusStateType } from "./interfaces";

export interface PlexusRuntime {
	// track a change and propigate to all listeneing children in instance
		stateChange<Value=PlexusStateType>(key: string, value: Value)
		broadcast<Value=PlexusStateType>(key: string, type: SubscriptionTypes, value: Value): void
		/**
		 * 
		 * @param _key The key of the object being wathced
		 * @param _callback The function to call when the value changes
		 * @returns A function to remove the watcher
		 */
		subscribe<Value=PlexusStateType>(_key: string, typeOrCallback: SubscriptionTypes | Fn<Value>, _callback?: Fn<Value>): () => void
		/**
		 * Either get all watchers on this runtime or get the specific watchers on an event
		 * @param key (optional) The event key
		 */
		getWatchers(key: string): { key: string; value: any; }
		getWatchers(): Map<string, { key: string; value: any; }>

		removeWatchers(type: SubscriptionTypes, key: string)
		log
}
type Fn<Value> = (value: Value) => void
type SubscriptionTypes = 'state' | ' collection' | 'event' | 'storage' | `plugin_${string}`


/**
 * Create a runtime for an instance NOTE: NOT FOR PUBLIC USE
 * @param instance the instance the runtime is running on
 * @returns 
 */
export function _runtime(instance: () => PlexusInstance): PlexusRuntime {
	const _internalStore = {
		_conductor: new EventEmitter<{key: string|number, value: any}>(),
		_watchers: new Map<string|number, Map<string|Number, (v: any) => void>>(),
	}

	const genEventName = (type: SubscriptionTypes, key: string) => `${type}_${key}`

	
	

	

	
	// function subscribe<Value=PlexusStateType>(key: string | number, callback: Fn<Value>);
	

	// function unsubscribe(key: string|number, watcherKey: string | number){
	// 	// if the parent key does not exist, fail silently
	// 	// if(!_internalStore._watchers.has(key)){return}
	// 	// const callback = _internalStore._watchers.get(key).get(watcherKey)
	// 	// _internalStore._conductor.removeListener('stateChange', callback)
	// 	// _internalStore._watchers.get(key).delete(watcherKey)
	// }

	

	function log(type: 'warn' | 'info' | 'error', message: string){
		const typeColors = {
			'info': '#4281A4',
			'warn': '#E9D985',
			'error': '#CE2D4F'
		}
		console[type](`%cPlexus(${instance().name}) ${type.toUpperCase()}:%c ${message}`, `color: ${typeColors[type]};`, 'color: unset;')
	}
	
	return {
		// track a change and propigate to all listeneing children in instance
		stateChange<Value=PlexusStateType>(key: string, value: Value){	
			_internalStore._conductor.emit(`state_${key}`, {key, value})
			_internalStore._conductor.emit(`*`, {key, value})
		},
		broadcast<Value=PlexusStateType>(key: string, type: SubscriptionTypes, value: Value){
			_internalStore._conductor.emit(genEventName(type, key), {key, value})
		},
		/**
		 * 
		 * @param _key The key of the object being wathced
		 * @param _callback The function to call when the value changes
		 * @returns A function to remove the watcher
		 */
		subscribe<Value=PlexusStateType>(_key: string, typeOrCallback: SubscriptionTypes | Fn<Value>, _callback?: Fn<Value>){
			const type = typeof typeOrCallback === 'string' ? typeOrCallback : 'state'
			if(typeof typeOrCallback === 'function' && _callback === undefined){
				_callback = typeOrCallback
			}
			function callback(data: {key: string, value: Value}){
				const {key, value} = data

				if(_key === key){
					_callback(value)
				}
			} 

			// 
			const unsub = _internalStore._conductor.on(genEventName(type, _key), callback)
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
		},
		// unsubscribe,
		getWatchers(key?: string){
			if(!key) {
				return _internalStore._conductor.events
			}
			else{
				return _internalStore._conductor.events.get(`${key}`)
			}
		},
		removeWatchers(type: SubscriptionTypes, key: string){
			_internalStore._conductor.events.get(genEventName(type, key))
		},
		log
	} as PlexusRuntime
}