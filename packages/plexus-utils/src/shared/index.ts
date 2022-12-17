export * from './itemManipulation'
export function isServer() {
	return typeof process !== 'undefined' && process?.release?.name === 'node'
}
export const genUID = () =>
	Math.random().toString(36).substring(2, 15) +
	Math.random().toString(36).substring(2, 15)

export const isAsyncFunction = (
	fn: (...args: any[]) => unknown | Promise<unknown>
) =>
	typeof fn === 'function' &&
	fn.constructor.name === 'AsyncFunction' &&
	fn[Symbol.toStringTag] === 'AsyncFunction'
