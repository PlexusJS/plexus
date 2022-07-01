export { extractEnv, getEnv } from "./extractenv"
export type AlmostAnything = string | number | symbol | Record<any, any> | Array<any> | Object

export function isObject(item: any): item is Object {
	return item && item !== null && typeof item === "object" && !Array.isArray(item)
}

export const convertThingToString = (input: any) =>
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
