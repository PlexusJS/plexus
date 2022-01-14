import { PlexusInstance } from "./interfaces"

type EventHandler = (v: any) => void

export function _event<PayloadType=any>(instance: () => PlexusInstance){
	const _internalStore = {
		_events: new Map<string|number, Map<string|Number, EventHandler>>(),
		_destroyers: new Map<string, ()=>unknown>(),
		_name: `e${instance().genNonce()}`,
		_uses: 0,
		_maxUses: -1,
		_disabled: false,
	}
	function on(callback: (payload: PayloadType) => void){
		if(_internalStore._disabled){ return }
		const cleanup = instance()._runtime.subscribe(`${_internalStore._name}`, 'event', callback)
		_internalStore._destroyers.set(callback.toString(), cleanup)
		return () => cleanup()
	}
	//TODO: Fix this function and allow
	function once(callback: (payload: PayloadType) => void){
		if(_internalStore._disabled){ return }
		_internalStore._maxUses = 1
		const cleanup = instance()._runtime.subscribe(`${_internalStore._name}`, 'event', callback)
		return () => cleanup()
	}

	function emit(payload: PayloadType){
		if(_internalStore._disabled){ return }
		_internalStore._uses += 1
		instance()._runtime.broadcast(`${_internalStore._name}`, 'event', payload)
	}
	function disable(torf: boolean=false){
		_internalStore._disabled = torf
		
	}

	const event = Object.freeze({
		on,
		emit,
		disable,

	})
	return event
}