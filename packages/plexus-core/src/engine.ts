import { PlexusWatcher } from "./interfaces"
export interface EngineEventReceiver {
	from: string
	listener: PlexusWatcher
}
export class EventEngine {
	events: Map<string | number, Array<EngineEventReceiver>>
	constructor() {
		this.events = new Map()
	}
	on(eventId: string | number, listener: PlexusWatcher, origin?: string) {
		if (!eventId || eventId === "") {
			console.warn("Event Engine: Missing an eventId")
			return () => null
		}
		// create the variables to assign in the events list map
		const from = origin || "unknown"
		const eventWatcher = { from, listener }
		// ensure the eventId has a list, if not, create it
		if (!this.events.has(eventId)) {
			this.events.set(eventId, [])
		}

		this.events.get(eventId)?.push(eventWatcher)
		return () => this.removeListener(eventId, eventWatcher)
	}
	removeListener(eventId: string | number, eventWatcher: EngineEventReceiver) {
		if (!this.events.has(eventId)) {
			return
		}
		const idx = this.events.get(eventId)?.indexOf(eventWatcher) ?? -1
		const eventWatchers = this.events.get(eventId)
		// console.log(`found index ${idx}; with ${eventWatchers?.[0].listener}`)
		if (eventWatchers && idx === 0) {
			this.events.set(eventId, [...eventWatchers.splice(idx + 1)])
		} else if (eventWatchers && idx > -1) {
			this.events.set(eventId, [...eventWatchers.splice(0, idx - 1), ...eventWatchers.splice(idx + 1)])
		}
		if (this.events.get(eventId)?.length === 0) {
			this.events.delete(eventId)
		}
	}
	emit(eventId: string | number, args: any) {
		if (!this.events.has(eventId)) {
			return
		}
		this.events.get(eventId)?.forEach((callbackObj) => callbackObj.listener(args))
	}
	once(eventId: string | number, eventWatcher: EngineEventReceiver) {
		const remove = this.on(eventId, (...args) => {
			remove()
			eventWatcher.listener(...args)
		})
	}
}
