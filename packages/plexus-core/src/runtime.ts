import { EventEngine } from "./engine"
import { PlexusInstance } from "./instance"
import { PlexusStateType } from "./state"

export type PlexusRuntime = RuntimeInstance
interface RuntimeConfig {
	logLevel: "debug" | "warn" | "error" | "silent"
}
type Fn<Value> = (value: Value) => void
type LogLevels = Exclude<RuntimeConfig["logLevel"], "silent"> | "info"
type SubscriptionTypes = "state" | " collection" | "event" | "storage" | `plugin_${string}` | "*"

export class RuntimeInstance {
	private _internalStore: { _conductor: EventEngine }
	private instance: () => PlexusInstance
	constructor(instance: () => PlexusInstance, protected config: Partial<RuntimeConfig> = {}) {
		this.instance = instance
		this._internalStore = {
			_conductor: new EventEngine(),
		}
	}
	/**
	 * track a change and propagate to all listening children in instance
	 *  */
	stateChange<Value = PlexusStateType>(key: string, value: Value) {
		// this.broadcast(key, "state", { key, value })
		this.broadcast(key, { key, value }, { type: "state" })
		this.broadcast(key, { key, value }, { type: "*" })
	}
	broadcast<Value = PlexusStateType>(key: string, value: Value, options?: { type?: SubscriptionTypes }) {
		this.log("info", `Broadcasting a change to ${key}`)
		// _internalStore._conductor.emit(genEventName(type, key), { key, value })
		this._internalStore._conductor.emit(key, { key, value })
	}
	/**
	 *
	 * @param _key The key of the object being wathced
	 * @param _callback The function to call when the value changes
	 * @returns A function to remove the watcher
	 */
	subscribe<Value = PlexusStateType>(_key: string, _callback: Fn<Value>, options?: { type?: SubscriptionTypes }) {
		// const type = typeof typeOrCallback === "string" ? typeOrCallback : "state"
		// if (typeof typeOrCallback === "function" && _callback === undefined) {
		// 	_callback = typeOrCallback
		// }
		// if (_callback === undefined && typeof typeOrCallback === "string") {
		// 	this.log("warn", `Missing a subscription function; skipping assignment`)
		// 	return
		// }

		this.log("info", `Subscribing to changes of ${_key}`)
		function callback(data: { key: string; value: Value }) {
			const { key, value } = data

			if (_key === key) {
				_callback?.(value)
			}
		}

		//
		// const unsub = _internalStore._conductor.on(genEventName(type, _key), callback)
		const unsub = this._internalStore._conductor.on(_key, callback)

		// return the watcher unsubscribe function
		return () => {
			unsub()
			// we also need to remove the watcher from the conductor
			// _internalStore._watchers.get(type).delete(_key)
		}
	}

	/**
	 * Either get all watchers on this runtime or get the specific watchers on an event
	 * @param key (optional) The event key
	 */
	getWatchers(key?: string) {
		// if (key && _internalStore._conductor.events.has(`${key}`)) {
		// 	return _internalStore._conductor.events.get(`${key}`).value
		// } else {
		// 	return _internalStore._conductor.events
		// }
		return key && this._internalStore._conductor.events.has(`${key}`) ? this._internalStore._conductor.events : {}
	}
	/**
	 * remove a watcher from the runtime given a type and a key
	 * @param type The type of watcher to remove
	 * @param key The key of the watcher to remove
	 */
	removeWatchers(type: SubscriptionTypes, key: string) {
		this._internalStore._conductor.events.get(key)
	}
	/**
	 * Runtime logger function
	 * @param type The type of log message
	 * @param message The message to send
	 */
	log(type: LogLevels, ...message: any[]) {
		const typeColors = {
			info: "#4281A4",
			warn: "#E9D985",
			error: "#CE2D4F",
		}
		const callLog = () =>
			console[type](
				`%cPlexus(%c${this.instance().name}%c) ${type.toUpperCase()}:%c`,
				`color: ${typeColors[type] || "#4281A4"};`,
				"color: #D8DC6A;",
				`color: ${typeColors[type] || "#4281A4"};`,
				"color: unset;",
				...message
			)
		// TODO Logging must only occur when the config parameter is set
		if (this.instance().settings?.logLevel) {
			switch (this.instance().settings.logLevel) {
				case "warn": {
					if (type === "error" || type === "warn") callLog()
				}
				case "error": {
					type === "error" && callLog()
				}
				case "silent": {
					return
				}
				case "debug": {
					callLog()
				}
			}
			return
		}

		// commanet or uncomment to allow or disallow dev logging (always on)
		// callLog()
	}
	/**
	 * Runtime Conductor Engine
	 */
	get engine() {
		return this._internalStore._conductor
	}
}
/**
 * Create a runtime for an instance NOTE: NOT FOR PUBLIC USE
 * @param instance the instance the runtime is running on
 * @returns
 * @private
 */
export function _runtime(instance: () => PlexusInstance, config?: Partial<RuntimeConfig>) {
	return new RuntimeInstance(instance, config)
}
