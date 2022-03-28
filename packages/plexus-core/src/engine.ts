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
			return () => null
		}
		const from = origin || "unknown"
		const eventWatcher = { from, listener }
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
		const idx = this.events.get(eventId)?.indexOf(eventWatcher)
		const eventWatchers = this.events.get(eventId)
		if (eventWatchers && idx && idx > -1) {
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
