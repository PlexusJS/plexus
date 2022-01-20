// import { PlexusInstance } from "./interfaces"

import { PlexusInstance } from "./instance"

type EventHandler = (v: any) => void

export type PlexusEventInstance<PayloadType=any> = {
	on(callback: (payload: PayloadType) => void): () => void
	emit(payload: PayloadType): void,
	disable(disable: boolean): void
}

export function _event<PayloadType=any>(instance: () => PlexusInstance): PlexusEventInstance<PayloadType>{
	const _internalStore = {
		_events: new Map<string|number, Map<string|Number, EventHandler>>(),
		_destroyers: new Map<string, ()=>unknown>(),
		_name: `e${instance().genNonce()}`,
		_uses: 0,
		_maxUses: -1,
		_disabled: false,
	}
	//TODO: Fix this function and allow
	function once(callback: (payload: PayloadType) => void){
		if(_internalStore._disabled){ return }
		_internalStore._maxUses = 1
		const cleanup = instance()._runtime.subscribe(`${_internalStore._name}`, 'event', callback)
		return () => cleanup()
	}

	

	const event = Object.freeze({
		on(callback: (payload: PayloadType) => void){
			if(_internalStore._disabled){ return }
			const cleanup = instance()._runtime.subscribe(`${_internalStore._name}`, 'event', callback)
			_internalStore._destroyers.set(callback.toString(), cleanup)
			return () => cleanup()
		},
		emit(payload: PayloadType){
			if(_internalStore._disabled){ return }
			_internalStore._uses += 1
			instance()._runtime.broadcast(`${_internalStore._name}`, 'event', payload)
		},
		disable(disable: boolean=false){
			_internalStore._disabled = disable
			
		}
	})
	return event
}