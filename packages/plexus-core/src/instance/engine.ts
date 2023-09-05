import { deepClone, deepMerge } from '@plexusjs/utils'
import { PlexusInternalWatcher } from '../types'
export interface EngineEventReceiver {
	from: string
	listener: PlexusInternalWatcher
}
export class EventEngine {
	private batching: boolean = false
	events: Map<string, Array<EngineEventReceiver>>
	pendingEventPayloads: Map<string, any>

	constructor() {
		this.events = new Map()
		this.pendingEventPayloads = new Map()
	}

	/**
	 * Pause and store all events until the return function is called. Once called, all events will be emitted.
	 */
	halt() {
		this.batching = true
		return () => {
			this.release()
		}
	}
	/**
	 * Emit all stored concatenated events and resume normal event emitting.
	 */
	release() {
		this.batching = false
		this.pendingEventPayloads.forEach((args, eventId) => {
			this.emit(eventId, args)
		})
		this.pendingEventPayloads.clear()
	}

	on(eventId: string, listener: PlexusInternalWatcher, origin?: string) {
		if (!eventId || eventId === '') {
			console.warn('Event Engine: Missing an eventId')
			return () => null
		}
		// create the variables to assign in the events list map
		const from = origin || 'unknown'
		const eventWatcher = { from, listener }
		// ensure the eventId has a list, if not, create it
		if (!this.events.has(eventId)) {
			this.events.set(eventId, [])
		}

		this.events.get(eventId)?.push(eventWatcher)
		return () => this.removeListener(eventId, eventWatcher)
	}
	onAny(listener: PlexusInternalWatcher, origin?: string) {
		// create the variables to assign in the events list map
		const from = origin || 'unknown'
		const eventWatcher = { from, listener }

		// ensure the global has a list, if not, create it
		if (!this.events.has('global')) {
			this.events.set('global', [])
		}

		this.events.get('global')?.push(eventWatcher)
		return () => this.removeListener('global', eventWatcher)
	}
	removeListener(eventId: string, eventWatcher: EngineEventReceiver) {
		// If this eventId is not tracked in the event engine
		if (!this.events.has(eventId)) {
			return
		}

		// find the item event tracker given the tracking ID
		const eventWatchers = this.events.get(eventId)
		// if it exists...
		if (eventWatchers) {
			// get the watcher index within the tracker's array
			const idx = eventWatchers.indexOf(eventWatcher) ?? -1

			if (idx === 0) {
				this.events.set(eventId, [...eventWatchers.slice(idx + 1)])
			} else if (idx > -1) {
				this.events.set(eventId, [
					...eventWatchers.slice(0, idx),
					...eventWatchers.slice(idx + 1),
				])
			}
		}

		// if this id no longer has any items, delete the record
		if (this.events.get(eventId)?.length === 0) {
			this.events.delete(eventId)
		}
	}
	emit(eventId: string, args: any) {
		// this.schedule.addTask(() => {
		// if we're batching, store the event payload
		if (this.batching) {
			this.pendingEventPayloads.set(
				eventId,
				deepMerge(
					this.pendingEventPayloads.has(eventId)
						? this.pendingEventPayloads.get(eventId)
						: args,
					args
				)
			)
			return
		}
		// run the event listeners for this event id
		this.events
			.get(eventId)
			?.forEach((callbackObj) => callbackObj.listener(args))
		// run the event listeners for the global event id
		this.events
			.get('global')
			?.forEach((callbackObj) => callbackObj.listener(args))
		// })
	}
	once(eventId: string, eventWatcher: EngineEventReceiver) {
		const remove = this.on(eventId, (...args) => {
			remove()
			eventWatcher.listener(...args)
		})
	}
}
