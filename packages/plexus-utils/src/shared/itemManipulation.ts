import { AlmostAnything } from '../types'

export function isObject(item: any): item is Object {
	if (typeof item === 'object' && item !== null) {
		if (typeof Object.getPrototypeOf === 'function') {
			const prototype = Object.getPrototypeOf(item)
			return prototype === Object.prototype || prototype === null
		}

		return Object.prototype.toString.call(item) === '[object Object]'
	}

	return false
}

export const convertThingToString = (input: any) =>
	typeof input === 'object'
		? JSON.stringify(input)
		: typeof input === 'function'
		? input.toString()
		: String(input)
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

export const convertStringToThing = (inp: string) => {
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
		if (inp === 'true') {
			return true
		}
		if (inp === 'false') {
			return false
		}
		// ...as a string
		return inp
	}
}
// A function to deeply merge two things (objects or arrays).
export function deepMerge<
	Thing1 extends Record<string | number | symbol, any> = Record<
		string | number | symbol,
		any
	>,
	Thing2 extends Record<string | number | symbol, any> = Record<
		string | number | symbol,
		any
	>,
	Thing extends Thing1 & Thing2 = Thing1 & Thing2
>(target: Thing1, source: Thing2, override = false): Thing1 & Thing2 {
	let output = Object.assign({} as Thing2, target)
	if (
		(isObject(target) && isObject(source)) ||
		(Array.isArray(target) && Array.isArray(source))
	) {
		if (Array.isArray(target) && Array.isArray(source) && !override) {
			return [...target, ...source] as any
		}
		for (const key in source) {
			if (isObject(source[key])) {
				if (!(key in target)) {
					Object.assign(output, { [key]: source[key] })
				} else {
					output[key] = deepMerge(
						target[key] as any,
						source[key] as any,
						override
					) as any
				}
			} else {
				if (
					Array.isArray(target[key]) &&
					Array.isArray(source[key]) &&
					!override
				) {
					Object.assign(output, {
						[key]: [...(target[key] as any), ...(source[key] as any)],
					})
				} else Object.assign(output, { [key]: source[key] })
			}
		}
	}
	// if it was originally an array, return an array
	if (Array.isArray(target) && Array.isArray(source)) {
		return Object.values(output) as any as Thing
	}

	return output as Thing
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
	if (typeof thing === 'object' && thing !== undefined && thing !== null) {
		const cloned: Type = Array.isArray(thing)
			? (Array.from(thing) as unknown as Type)
			: ({ ...thing } as unknown as Type)
		for (const key in thing) {
			if ((thing as Object).hasOwnProperty(key)) {
				cloned[key] = deepClone(thing[key])
			}
		}
		// if it was originally an array, return an array
		if (Array.isArray(thing)) {
			return Object.values(cloned as any) as Type
		}
		// if it was originally an object, return an object
		return cloned
	}
	return thing
}
export function isEqual(a: NonNullable<any>, b: NonNullable<any>): boolean {
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
	if (a === b) {
		return true
	}
	return false
}
