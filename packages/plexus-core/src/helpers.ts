export type AlmostAnything = string | number | symbol | Record<any, any> | Array<any> | Object

export function isObject(item: any): item is Object {
	return item && typeof item === "object" && !Array.isArray(item)
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
export function deepClone<Type = AlmostAnything>(obj: Type): Type {
	if (obj === null || typeof obj !== "object") {
		return obj
	}
	if (obj instanceof Date) {
		return new Date(obj.getTime()) as any as Type
	}
	if (obj instanceof RegExp) {
		return new RegExp(obj) as any as Type
	}
	// must be an object

	const cloned: Type = Object.create(obj as Object)
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			cloned[key] = deepClone(obj[key])
		}
	}
	if (Array.isArray(obj)) {
		return Object.values(cloned) as any as Type
	}
	// if it was originally an array, return an array
	if (Array.isArray(obj)) {
		return Object.values(cloned) as any as Type
	}
	// if it was originally an object, return an object
	return cloned
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
