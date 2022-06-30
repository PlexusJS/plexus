import { Watchable } from "."

export type AlmostAnything = string | number | symbol | Record<any, any> | Array<any> | Object

export function isObject(item: any): item is Object {
	return item && item !== null && typeof item === "object" && !Array.isArray(item)
}

export function deepMerge<Thing extends Object>(target: Thing, source: Thing): Thing {
	let output = Object.assign({}, target)
	if ((isObject(target) && isObject(source)) || (Array.isArray(target) && Array.isArray(source))) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!(key in target)) {
					Object.assign(output, { [key]: source[key] })
				} else {
					output[key] = deepMerge(target[key], source[key])
				}
			} else {
				Object.assign(output, { [key]: source[key] })
			}
		}
	}
	// if it was originally an array, return an array
	if (Array.isArray(target) && Array.isArray(source)) {
		return Object.values(output) as any as Thing
	}

	return output
}

// a deep clone of anything
export function deepClone<Type = AlmostAnything>(thing: Type): Type {
	if (thing instanceof Date) {
		return new Date(thing.getTime()) as any as Type
	}
	if (thing instanceof RegExp) {
		return new RegExp(thing) as any as Type
	}
	// must be an object
	if (isObject(thing)) {
		const cloned: Type = Object.create(thing as Object)
		for (const key in thing) {
			if ((thing as Object).hasOwnProperty(key)) {
				cloned[key] = deepClone(thing[key])
			}
		}
		if (Array.isArray(thing)) {
			return Object.values(cloned) as any as Type
		}
		// if it was originally an array, return an array
		if (Array.isArray(thing)) {
			return Object.values(cloned) as any as Type
		}
		// if it was originally an object, return an object
		return cloned
	}
	return thing
}

export function isEqual(a: AlmostAnything, b: AlmostAnything): boolean {
	if (a === b) {
		return true
	}
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime()
	}
	if (a instanceof RegExp && b instanceof RegExp) {
		return a.toString() === b.toString()
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false
		}
		for (let i = 0; i < a.length; i++) {
			if (!isEqual(a[i], b[i])) {
				return false
			}
		}
		return true
	}
	if (isObject(a) && isObject(b)) {
		const aKeys = Object.keys(a)
		const bKeys = Object.keys(b)
		if (aKeys.length !== bKeys.length) {
			return false
		}
		for (const key of aKeys) {
			if (!isEqual(a[key], b[key])) {
				return false
			}
		}
		return true
	}
	return false
}

export const convertToString = (input: any) =>
	typeof input === "object" ? JSON.stringify(input) : typeof input === "function" ? input.toString() : String(input)
export const hash = function (input: string) {
	/* Simple hash function. */
	let a = 1,
		c = 0,
		h,
		o
	if (input) {
		a = 0
		/*jshint plusplus:false bitwise:false*/
		for (h = input.length - 1; h >= 0; h--) {
			o = input.charCodeAt(h)
			a = ((a << 6) & 268435455) + o + (o << 14)
			c = a & 266338304
			a = c !== 0 ? a ^ (c >> 21) : a
		}
	}
	return String(a)
}

export const convertStringToType = (inp: string) => {
	try {
		// try to parse it as JSON (array or object)
		return JSON.parse(inp)
	} catch (e) {
		// if that fails, try...

		// ...as a number
		const num = Number(inp)
		if (!isNaN(num)) {
			return num
		}
		// ...as a boolean
		if (inp === "true") {
			return true
		}
		if (inp === "false") {
			return false
		}
		// ...as a string
		return inp
	}
}

export const genUID = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

export const isAsyncFunction = (fn: (...args: any[]) => any | Promise<any>) => typeof fn === "function" && fn.constructor.name === "AsyncFunction"
