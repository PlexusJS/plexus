export type LiteralType<T> = T extends string
	? T & string
	: T extends number
	? T & number
	: T extends boolean
	? boolean
	: T extends symbol
	? T & symbol
	: T extends undefined
	? undefined
	: T extends null
	? null
	: T extends Function
	? T
	: T extends Array<infer U>
	? Array<U>
	: T extends Record<infer K, infer V>
	? Record<K, V>
	: T

export type AlmostAnything =
	| string
	| number
	| boolean
	| symbol
	| Record<any, any>
	| Array<any>
	| Object

export type TypeOrReturnType<T> = T extends (...args: any[]) => infer R
	? LiteralType<R>
	: LiteralType<T>

export type UnionToIntersection<U> = (
	U extends any ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never
export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true
