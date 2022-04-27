import { convertStringToType, deepMerge, isEqual, isObject } from "./helpers"
import { PlexusInstance } from "./instance"
import { WatchableValue } from "./interfaces"
import { PlexusStateInstance } from "./state"
// import { PlexusInstance, PxStorageInstance } from './interfaces';
export interface PlexusStorageInstance {
	get(key: string): any
	set(key: string, value: any): void
	remove(key: string): void
	patch(key: string, value: any): void
	watching: unknown & (WatchableValue | PlexusStateInstance)[]
	monitor(key: string, object: WatchableValue | PlexusStateInstance)
	sync()
}

/**
 *
 * @returns returns the localstorage if available, otherwise returns null
 */
const getLocalStorage = () => {
	try {
		const ls = window?.localStorage ? window.localStorage : localStorage
		return typeof ls.getItem !== "function" ? null : ls
	} catch (e) {
		return null
	}
}

type AlmostAnything = string | number | symbol | Record<any, any> | Array<any>
export type StorageOverride = {
	prefix: string
	get(key: string): AlmostAnything | Promise<any>
	set(key: string, value: any): AlmostAnything | Promise<any>
	remove(key: string): void | Promise<void>
	patch(key: string, value: any): AlmostAnything | Promise<any>
}
// storage func -> called from instance OR by integration -> hooks up to the instance
export function storage(instance: () => PlexusInstance, name?: string, override?: StorageOverride): PlexusStorageInstance {
	const getKey = (key: string) => `${_internalStore._prefix}${key}`

	const _internalStore = {
		_name: name || "localStorage",
		_storage: getLocalStorage(),
		_prefix: override?.prefix || "plexus-",
		tracking: new Set<WatchableValue>(),
	}

	const get = (key: string): any => {
		// try to run with localstorage
		if (getLocalStorage() === null) {
			instance().runtime.log("warn", "No localstorage available, cannot get persisted value")
			return
		}
		instance().runtime.log("info", `Retrieving value for key ${getKey(key)}`)
		const val = getLocalStorage()?.getItem(getKey(key))
		if (typeof val === "string" && convertStringToType(val)) {
			return convertStringToType(val)
		} else return null
	}

	const set = (key: string, value: any): void => {
		// try to run with localstorage
		const ls = getLocalStorage()
		if (ls === null) {
			instance().runtime.log("warn", "No localstorage available, cannot persist in storage")
			return
		}

		if (isObject(value)) {
			ls.setItem(getKey(key), JSON.stringify(value))
		} else if (Array.isArray(value)) {
			ls.setItem(getKey(key), JSON.stringify(Object.values<typeof value>(value)))
		} else {
			ls.setItem(getKey(key), String(value))
		}
	}

	const patch = (key: string, value: any): void => {
		// try to run with localstorage
		const ls = getLocalStorage()
		if (ls === null) {
			instance().runtime.log("warn", "No localstorage available, cannot set value to storage")
			return
		}
		const item = ls.getItem(key)
		if (!item) {
			instance().runtime.log("warn", "Item in storage does not exist, cannot patch")
			return
		}
		if (isObject(value)) {
			ls.setItem(getKey(key), JSON.stringify(deepMerge(ls.getItem(key), value)))
		} else if (Array.isArray(value)) {
			ls.setItem(getKey(key), JSON.stringify(Object.values<typeof value>(deepMerge(JSON.parse(item), value))))
		} else {
			ls.setItem(getKey(key), String(value))
		}
	}
	const remove = (key: string): void => {
		// try to run with localstorage
		const ls = getLocalStorage()
		if (ls === null) {
			instance().runtime.log("warn", "No localstorage available, cannot remove value from storage")
			return
		}
		ls.removeItem(getKey(key))
	}

	const store = Object.freeze({
		get: override?.get || get,
		set: override?.set || set,
		remove: override?.remove || remove,
		patch: override?.patch || patch,
		get watching() {
			return Array.from(_internalStore.tracking)
		},
		monitor(key: string, object: WatchableValue) {
			if (key === "" || key === undefined) {
				instance().runtime.log("warn", `Can't monitor an object with no key`)
				return
			}

			_internalStore.tracking.add(object)
			let storedValue = this.get(key)
			instance().runtime.log("info", `Persisting new key ${key}`, JSON.stringify(this.watching))
			if (!storedValue) {
				instance().storage?.set(key, object.value)
			}

			// instance().runtime.log("info", `Trying to apply persisted value ${storedValue}`)

			// if (storedValue !== undefined && storedValue !== null) {
			// 	instance().runtime.log("info", "Applying persisted value")
			// 	object.set(storedValue)
			// }
		},
		sync() {
			instance().runtime.log("info", "Syncing storage storage...")
			_internalStore.tracking.forEach((object) => {
				let key: string | null = null
				if (typeof object.key === "string") {
					key = object.key
				} else if (typeof object.name === "string") {
					key = object.name
				}

				if (key === "" || key === undefined || key === null) {
					instance().runtime.log("warn", `Can't sync an object with no key`)
					return
				}

				// instance().storage.monitor(key, object)
				let storedValue = this.get(key)
				if (storedValue) {
					const val = object.value
					if (val && (val !== storedValue || !isEqual(val, storedValue))) {
						instance().runtime.log("info", `Syncing "${key}" with storage value "${storedValue}"`)
						object.set(storedValue)
					} else {
						instance().runtime.log("info", `Skipping the storage sync of item "${key}"; Values are already equal.`)
					}
				}
			})
		},
	})
	instance()._storages.set(_internalStore._name, store)
	return store
}
