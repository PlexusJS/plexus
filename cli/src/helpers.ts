import { execSync } from 'child_process'
import * as fs from 'fs'
const __dirname = process.cwd()

export function tryIt<T = any>(fn: (...args: any[]) => T): T | boolean {
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

// fetch the most recent version of the packages given the tag using the cli command `npm view @plexusjs/core version`
export const fetchLatestVersion = (tag: 'canary' | 'latest') =>
	execSync(`npm view @plexusjs/core@${tag} version`, {
		encoding: 'utf8',
	}).trim()
