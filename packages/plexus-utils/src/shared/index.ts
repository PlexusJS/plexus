export * from './itemManipulation'
export function isServer() {
	return typeof process !== 'undefined' && process?.release?.name === 'node'
}
export const genUID = () =>
	Math.random().toString(36).substring(2, 15) +
	Math.random().toString(36).substring(2, 15)

export const isAsyncFunction = <ReturnedValue>(
	fn: (...args: any[]) => ReturnedValue | Promise<ReturnedValue>
): fn is () => Promise<ReturnedValue> =>
	typeof fn === 'function' &&
	(fn.constructor.name === 'AsyncFunction' ||
		fn[Symbol.toStringTag] === 'AsyncFunction')
