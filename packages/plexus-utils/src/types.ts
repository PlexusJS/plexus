export type LiteralType<T> = T extends string
	? T & string
	: T extends number
	? T & number
	: T extends boolean
	? boolean
	: T extends symbol
	? T & symbol
	: T extends Function
	? T
	: T extends Array<infer U>
	? Array<U>
	: T extends Record<infer K, infer V>
	? Record<K, V>
	: T

export type Primitives = string | number | boolean | symbol
export type AlmostAnything =
	| string
	| number
	| boolean
	| symbol
	| Primitives[]
	| Record<string, Primitives>
	| Object

export type TypeOrReturnType<T> = T extends (...args: any[]) => infer R ? R : T

export type UnionToIntersection<U> = (
	U extends any ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never
export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true

export type PlexusWatchableValueInterpreter<Value> = Value extends (
	...args: any
) => any
	? ReturnType<Value>
	: Value

export declare type AsyncState<T> =
	| {
			loading: boolean
			error?: undefined
			value?: undefined
	  }
	| {
			loading: true
			error?: Error | undefined
			value?: T
	  }
	| {
			loading: false
			error: Error
			value?: undefined
	  }
	| {
			loading: false
			error?: undefined
			value: T
	  }

export declare type FunctionReturningPromise = (...args: any[]) => Promise<any>
export declare type PromiseType<P extends Promise<any>> = P extends Promise<
	infer T
>
	? T
	: never
declare type StateFromFunctionReturningPromise<
	T extends FunctionReturningPromise
> = AsyncState<PromiseType<ReturnType<T>>>
export declare type AsyncFnReturn<
	T extends FunctionReturningPromise = FunctionReturningPromise
> = [StateFromFunctionReturningPromise<T>, T]
