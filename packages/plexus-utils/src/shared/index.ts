/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

export * from './itemManipulation'

export function isServer() {
	return (
		typeof process !== 'undefined' && (process.env.SERVER_SOFTWARE || !window)
	)
}
export const genUID = () =>
	Math.random().toString(36).substring(2, 15) +
	Math.random().toString(36).substring(2, 15)

export const isAsyncFunction = <
	ReturnedValue,
	Args extends Array<unknown> = any[],
>(
	fn: (...args: Args) => ReturnedValue | Promise<ReturnedValue>
): fn is (...args: Args) => Promise<ReturnedValue> =>
	typeof fn === 'function' &&
	(fn.constructor.name === 'AsyncFunction' ||
		fn[Symbol.toStringTag] === 'AsyncFunction')
