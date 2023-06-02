import * as fs from 'fs'
export function tryIt(fn) {
	try {
		if (fn instanceof Function) {
			const val = fn()
			if (val !== undefined && val !== null) {
				return val
			}
		}
		return true
	} catch (e) {
		return false
	}
}
// make the core directory in the root folder
export const lookForCore = () =>
	tryIt(
		() =>
			!fs.existsSync(`${__dirname}/core`) && fs.mkdirSync(`${__dirname}/core`)
	)
export const lookForCoreModules = () =>
	tryIt(
		() =>
			!fs.existsSync(`${__dirname}/core/modules`) &&
			fs.mkdirSync(`${__dirname}/core/modules`)
	)
