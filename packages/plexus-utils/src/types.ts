export type LiteralType<T> = T extends string
	? string
	: T extends number
	? number
	: T extends boolean
	? boolean
	: T extends symbol
	? symbol
	: T extends undefined
	? undefined
	: T extends null
	? null
	: T extends Array<infer U>
	? Array<U>
	: T extends Record<infer K, infer V>
	? Record<K, V>
	: T extends Function
	? T
	: T

export type AlmostAnything =
	| string
	| number
	| symbol
	| Record<any, any>
	| Array<any>
	| Object
