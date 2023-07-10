// import { PlexusInstance } from "./interfaces"

import { PlexusInstance, instance } from './instance/instance'

type EventHandler = (v: any) => void

export type PlexusEventInstance<PayloadType = any> = EventInstance<PayloadType>
interface EventStore {
	_id: string
	_events: Map<string, Map<string, EventHandler>>
	_destroyers: Map<string, () => unknown>
	_once_destroyers: Map<string, () => unknown>
	_name: string
	_uses: number
	_maxUses: number
	_disabled: boolean
}

/**
 * A Plexus Event. This is a trackable event that can be listened to and fired.
 */
export class EventInstance<PayloadType = any> {
	private _internalStore: EventStore
	private instance: () => PlexusInstance
	/**
	 * The internal id of the event
	 */
	get id(): string {
		return `${this._internalStore._id}`
	}

	/**
	 * The name of the state (NOTE: set with the `.name(name)` function)
	 */
	get name() {
		return this._internalStore._name
	}
	/**
	 * Set the key of the state for enhanced internal tracking
	 */
	set name(key: string) {
		this._internalStore._name = `event_${key}`
	}

	constructor(instance: () => PlexusInstance) {
		this.instance = instance
		this._internalStore = {
			_id: instance().genId(),
			_events: new Map<string, Map<string, EventHandler>>(),
			_destroyers: new Map<string, () => unknown>(),
			_once_destroyers: new Map<string, () => unknown>(),
			_name: `evt_${instance().genId()}`,
			_uses: 0,
			_maxUses: -1,
			_disabled: false,
		}
	}
	/**
	 * Listen for an event only once
	 * @param callback The function to call when the event is fired
	 */
	once(callback: (payload: PayloadType) => void) {
		// if disabled, do nothing
		if (this._internalStore._disabled) {
			return () => {}
		}
		// subscribe to the event on the runtime
		const cleanup = this.instance().runtime.subscribe(
			`${this._internalStore._name}`,
			callback
		)
		this._internalStore._once_destroyers.set(this._internalStore._name, cleanup)
		return () => cleanup()
	}
	/**
	 * Listen for an event
	 * @param callback The function to call when the event is fired
	 */
	on(callback: (payload: PayloadType) => void) {
		// if disabled, do nothing
		if (this._internalStore._disabled) {
			return () => {}
		}
		// subscribe to the event on the runtime
		const cleanup = this.instance().runtime.subscribe(
			`${this._internalStore._name}`,
			callback
		)
		this._internalStore._destroyers.set(callback.toString(), cleanup)
		return () => cleanup()
	}
	/**
	 * Broadcast an event to all listeners
	 * @param payload The payload to send to all listeners
	 */
	emit(payload: PayloadType) {
		// if diabled, do nothing
		if (this._internalStore._disabled) {
			return
		}
		// increase internal use count
		this._internalStore._uses += 1
		// broadcast the event
		this.instance().runtime.broadcast(`${this._internalStore._name}`, payload)
		// if there are destoryers for the once event, remove them
		if (this._internalStore._once_destroyers.size > 0) {
			this._internalStore._once_destroyers.forEach((cleanup) => cleanup())
		}
	}
	/**
	 * Turn the Event Manager off/on
	 * @param disable {boolean} Should this event Engine be disabled
	 */
	disable(disable: boolean = true) {
		this._internalStore._disabled = disable
	}
}

export function _event<PayloadType = any>(instance: () => PlexusInstance) {
	return new EventInstance<PayloadType>(instance)
}

/**
 * Create a new event Engine
 * @returns An Event Instance
 */
export function event<PayloadType = any>() {
	return _event<PayloadType>(() => instance())
}
