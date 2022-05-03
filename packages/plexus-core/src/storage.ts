import { convertStringToType, convertToString, deepMerge, isEqual, isObject } from "./helpers"
import { PlexusInstance } from "./instance"
import { Watchable, WatchableValue } from "./watchable"

type ExtendedWatchable = Watchable<any> & Record<string, any>
type AlmostAnything = string | number | symbol | Record<any, any> | Array<any>
export type StorageOverride = {
	prefix: string
	get(key: string): AlmostAnything | Promise<any>
	set(key: string, value: any): AlmostAnything | Promise<any>
	remove(key: string): void | Promise<void>
	patch(key: string, value: any): AlmostAnything | Promise<any>
}
interface StorageStore {
	_name: string
	_storage: Storage | null
	_prefix: string
	tracking: Set<ExtendedWatchable>
}
export type PlexusStorageInstance = StorageInstance

export class StorageInstance {
	private _internalStore: StorageStore
	private instance: () => PlexusInstance

	constructor(instance: () => PlexusInstance, name?: string, private override?: StorageOverride) {
		this.instance = instance
		this._internalStore = {
			_name: name || "localStorage",
			_storage: StorageInstance.getLocalStorage(),
			_prefix: override?.prefix || "plexus-",
			tracking: new Set<ExtendedWatchable>(),
		}
		this.instance()._storages.set(this._internalStore._name, this)
	}
	private getKey(key: string) {
		return `${this._internalStore._prefix}${key}`
	}

	get(key: string): any {
		if (this.override?.get) {
			return this.override?.get(key)
		}
		// try to run with localstorage
		if (StorageInstance.getLocalStorage() === null) {
			this.instance().runtime.log("warn", "No localstorage available, cannot get persisted value")
			return
		}
		this.instance().runtime.log("info", `Retrieving value for key ${this.getKey(key)}`)
		const val = StorageInstance.getLocalStorage()?.getItem(this.getKey(key))
		if (typeof val === "string" && convertStringToType(val)) {
			return convertStringToType(val)
		} else return null
	}

	set(key: string, value: any): void {
		if (this.override?.set) {
			this.override?.set(key, value)
		}
		// try to run with localstorage
		const ls = StorageInstance.getLocalStorage()
		if (ls === null) {
			this.instance().runtime.log("warn", "No localstorage available, cannot persist in storage")
			return
		}

		if (isObject(value)) {
			ls.setItem(this.getKey(key), JSON.stringify(value))
		} else if (Array.isArray(value)) {
			ls.setItem(this.getKey(key), JSON.stringify(Object.values<typeof value>(value)))
		} else {
			ls.setItem(this.getKey(key), String(value))
		}
	}

	patch(key: string, value: any): void {
		if (this.override?.patch) {
			this.override?.patch(key, value)
		}
		// try to run with localstorage
		const ls = StorageInstance.getLocalStorage()
		if (ls === null) {
			this.instance().runtime.log("warn", "No localstorage available, cannot set value to storage")
			return
		}
		const item = ls.getItem(key)
		if (!item) {
			this.instance().runtime.log("warn", "Item in storage does not exist, cannot patch")
			return
		}
		if (isObject(value)) {
			ls.setItem(this.getKey(key), JSON.stringify(deepMerge(ls.getItem(key), value)))
		} else if (Array.isArray(value)) {
			ls.setItem(this.getKey(key), JSON.stringify(Object.values<typeof value>(deepMerge(JSON.parse(item), value))))
		} else {
			ls.setItem(this.getKey(key), String(value))
		}
	}
	remove(key: string): void {
		if (this.override?.get) {
			this.override?.remove(key)
		}
		// try to run with localstorage
		const ls = StorageInstance.getLocalStorage()
		if (ls === null) {
			this.instance().runtime.log("warn", "No localstorage available, cannot remove value from storage")
			return
		}
		ls.removeItem(this.getKey(key))
	}
	get watching() {
		return Array.from(this._internalStore.tracking)
	}
	monitor(key: string, object: Watchable<any>) {
		if (key === "" || key === undefined) {
			this.instance().runtime.log("warn", `Can't monitor an object with no key`)
			return
		}

		this._internalStore.tracking.add(object)
		let storedValue = this.get(key)
		this.instance().runtime.log("info", `Persisting new key ${key}` /*, JSON.stringify(this.watching)*/)
		if (!storedValue) {
			this.instance().storage?.set(key, object.value)
		}

		// instance().runtime.log("info", `Trying to apply persisted value ${storedValue}`)

		// if (storedValue !== undefined && storedValue !== null) {
		// 	instance().runtime.log("info", "Applying persisted value")
		// 	object.set(storedValue)
		// }
	}
	sync() {
		this.instance().runtime.log("info", "Syncing storage storage...")
		this._internalStore.tracking.forEach((object) => {
			let key: string | null = null
			if (typeof object?.key === "string") {
				key = object?.key
			} else if (typeof object?.name === "string") {
				key = object?.name
			}

			if (key === "" || key === undefined || key === null) {
				this.instance().runtime.log("warn", `Can't sync an object with no key`)
				return
			}

			// instance().storage.monitor(key, object)
			let storedValue = this.get(key)

			if (storedValue) {
				const val = object.value
				if (val && !isEqual(val, storedValue)) {
					this.instance().runtime.log(
						"info",
						`Syncing "${key}" with storage value "${convertToString(val)}" to "${convertToString(storedValue)}"`
					)
					object.set(storedValue)
				} else {
					this.instance().runtime.log("info", `Skipping the storage sync of item "${key}"; Values are already equal.`)
				}
			}
		})
	}
	/**
	 *
	 * @returns returns the localstorage if available, otherwise returns null
	 */
	private static getLocalStorage() {
		try {
			const ls = window?.localStorage ? window.localStorage : localStorage
			return typeof ls.getItem !== "function" ? null : ls
		} catch (e) {
			return null
		}
	}
}
// storage func -> called from instance OR by integration -> hooks up to the instance
export function storage(instance: () => PlexusInstance, name?: string, override?: StorageOverride): PlexusStorageInstance {
	return new StorageInstance(instance, name)
}
