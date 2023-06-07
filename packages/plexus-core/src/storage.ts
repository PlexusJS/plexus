import {
	convertStringToThing,
	convertThingToString,
	deepMerge,
	isEqual,
	isObject,
} from '@plexusjs/utils'
import { PlexusInstance } from './instance/instance'
import { Watchable, WatchableMutable } from './watchable'

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
	tracking: Map<string, ExtendedWatchable>
}
export type PlexusStorageInstance = StorageInstance

export class StorageInstance {
	private _internalStore: StorageStore
	private instance: () => PlexusInstance

	constructor(
		instance: () => PlexusInstance,
		name?: string,
		private override?: StorageOverride
	) {
		this.instance = instance
		this._internalStore = {
			_name: name || 'localStorage',
			_storage: StorageInstance.getLocalStorage(),
			_prefix: override?.prefix || 'plexus-',
			tracking: new Map(),
		}
		this.instance()._storages.set(this._internalStore._name, this)
	}
	private getKey(key: string) {
		return `${this._internalStore._prefix}${key}`
	}

	get<T extends any>(key: string): T | null {
		if (this.override?.get) {
			return this.override?.get(key) as T
		}
		// try to run with localstorage
		if (StorageInstance.getLocalStorage() === null) {
			this.instance().runtime.log(
				'warn',
				'No localstorage available, cannot get persisted value'
			)
			return null
		}
		if (!key) {
			this.instance().runtime.log('warn', `Cannot get value for key ${key}`)

			return null
		}
		this.instance().runtime.log(
			'info',
			`Retrieving value for key ${this.getKey(key)}`
		)
		const val = StorageInstance.getLocalStorage()?.getItem(this.getKey(key))
		if (typeof val === 'string' && convertStringToThing(val)) {
			return convertStringToThing(val)
		} else return null
	}

	set(key: string, value: any): void {
		if (this.override?.set) {
			this.override?.set(key, value)
			return
		}
		// try to run with localstorage
		const ls = StorageInstance.getLocalStorage()
		if (ls === null) {
			this.instance().runtime.log(
				'warn',
				'No localstorage available, cannot persist in storage'
			)
			return
		}

		if (isObject(value)) {
			ls.setItem(this.getKey(key), JSON.stringify(value))
		} else if (Array.isArray(value)) {
			ls.setItem(
				this.getKey(key),
				JSON.stringify(Object.values<typeof value>(value))
			)
		} else {
			ls.setItem(this.getKey(key), String(value))
		}
	}

	patch(key: string, value: any): void {
		if (this.override?.patch) {
			this.override?.patch(key, value)
			return
		}
		// try to run with localstorage
		const ls = StorageInstance.getLocalStorage()
		if (ls === null) {
			this.instance().runtime.log(
				'warn',
				'No localstorage available, cannot set value to storage'
			)
			return
		}
		const item = ls.getItem(key)
		if (!item) {
			this.instance().runtime.log(
				'warn',
				'Item in storage does not exist, cannot patch'
			)
			return
		}
		if (isObject(value)) {
			ls.setItem(
				this.getKey(key),
				JSON.stringify(deepMerge(ls.getItem(key), value))
			)
		} else if (Array.isArray(value)) {
			ls.setItem(
				this.getKey(key),
				JSON.stringify(
					Object.values<typeof value>(deepMerge(JSON.parse(item), value))
				)
			)
		} else {
			ls.setItem(this.getKey(key), String(value))
		}
	}
	remove(key: string): void {
		if (this.override?.remove) {
			this.override?.remove(key)
			return
		}
		// try to run with localstorage
		const ls = StorageInstance.getLocalStorage()
		if (ls === null) {
			this.instance().runtime.log(
				'warn',
				'No localstorage available, cannot remove value from storage'
			)
			return
		}
		ls.removeItem(this.getKey(key))
	}
	get watching() {
		return Array.from(this._internalStore.tracking)
	}
	monitor<O extends Watchable, Type = O extends Watchable<infer T> ? T : never>(
		key: string,
		object: O
	) {
		if (key === '' || key === undefined) {
			this.instance().runtime.log('warn', `Can't monitor an object with no key`)
			return
		}

		this._internalStore.tracking.set(key, object)
		let storedValue = this.get<Type>(key)
		this.instance().runtime.log(
			'info',
			`Persisting new key ${key}` /*, JSON.stringify(this.watching)*/
		)
		if (!storedValue) {
			this.instance().storage?.set(key, object.value)
			storedValue = object.value
		}
	}

	sync(checkValue?: any) {
		this.instance().runtime.log('info', 'Syncing storage...')
		this._internalStore.tracking.forEach(async (object) => {
			let key: string | null = null
			if (typeof object?.key === 'string') {
				key = object?.key
			} else if (typeof object?.name === 'string') {
				key = object?.name
			}

			if (key === '' || key === undefined || key === null) {
				this.instance().runtime.log('warn', `Can't sync an object with no key`)
				return
			}

			// this.monitor(key, object)
			let storedValue = await this.get(key)

			if (storedValue) {
				const val = checkValue ?? object.value
				if (!isEqual(val, storedValue as any)) {
					this.instance().runtime.log(
						'info',
						`Syncing "${key}" with storage value "${convertThingToString(
							val
						)}" to "${convertThingToString(storedValue)}"`
					)
					object.set(storedValue)
				} else {
					this.instance().runtime.log(
						'info',
						`Skipping the storage sync of item "${key}"; Values are already equal. (state["${convertThingToString(
							val
						)}"] storage["${convertThingToString(storedValue)}"])`
					)
				}
			} else {
				this.instance().runtime.log(
					'warn',
					`Can't sync with storage; No Stored Value found`
				)
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
			return typeof ls.getItem !== 'function' ? null : ls
		} catch (e) {
			return null
		}
	}
}
// storage func -> called from instance OR by integration -> hooks up to the instance
export function storage(
	instance: () => PlexusInstance,
	name?: string,
	override?: StorageOverride
): PlexusStorageInstance {
	return new StorageInstance(instance, name, override)
}
