// import { PlexusInstance } from "./interfaces"

import { PlexusInstance } from "./instance"

type EventHandler = (v: any) => void

export type PlexusEventInstance<PayloadType=any> = {
	/**
	 * Listen for an event only once
	 * @param callback The function to call when the event is fired
	 */
	once(callback: (payload: PayloadType) => void): () => void
	/**
	 * Listen for an event
	 * @param callback The function to call when the event is fired
	 */
	on(callback: (payload: PayloadType) => void): () => void
	/**
	 * Broadcast an event to all listeners
	 * @param payload The payload to send to all listeners
	 */
	emit(payload: PayloadType): void,
	/**
	 * Turn the Event Engine off
	 * @param disable Should this event Engine be disabled
	 */
	disable(disable: boolean): void
}

export function _event<PayloadType=any>(instance: () => PlexusInstance): PlexusEventInstance<PayloadType>{
	const _internalStore = {
		_events: new Map<string|number, Map<string|Number, EventHandler>>(),
		_destroyers: new Map<string, ()=>unknown>(),
		_once_destroyers: new Map<string, ()=>unknown>(),
		_name: `e${instance().genNonce()}`,
		_uses: 0,
		_maxUses: -1,
		_disabled: false,
	}

	

	const event = Object.freeze({
		once(callback: (payload: PayloadType) => void){
			// if disabled, do nothing
			if(_internalStore._disabled){ return }
			// subscribe to the event on the runtime
			const cleanup = instance()._runtime.subscribe(`${_internalStore._name}`, 'event', callback)
			_internalStore._once_destroyers.set(_internalStore._name, cleanup)
			return () => cleanup()
		},
		on(callback: (payload: PayloadType) => void){
			// if disabled, do nothing
			if(_internalStore._disabled){ return }
			// subscribe to the event on the runtime
			const cleanup = instance()._runtime.subscribe(`${_internalStore._name}`, 'event', callback)
			_internalStore._destroyers.set(callback.toString(), cleanup)
			return () => cleanup()
		},
		emit(payload: PayloadType){
			// if diabled, do nothing
			if(_internalStore._disabled){ return }
			// increase internal use count
			_internalStore._uses += 1
			// broadcast the event
			instance()._runtime.broadcast(`${_internalStore._name}`, 'event', payload)
			// if there are dwestoryers for the once event, remove them
			if(_internalStore._once_destroyers.size > 0){
				_internalStore._once_destroyers.forEach((cleanup) => cleanup())
			}
		},
		disable(disable: boolean=false){
			_internalStore._disabled = disable
			
		}
	})
	return event
}