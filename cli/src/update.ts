import * as path from 'path'
import * as glob from 'glob'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import yArgs from 'yargs'
import chalk from 'chalk'
import { fetchLatestVersion, tryIt } from './helpers'
import { execSync } from 'child_process'
import type { PackageJson } from './lib/types'
const yargs = yArgs(process.argv)
const __dirname = process.cwd()

// a function that iterates through the execution directory, finds all of the `package.json` files, and returns their full paths
export function findPackageJsons() {
	return glob.sync(path.join(process.cwd(), '**/package.json'), {
		ignore: ['**/node_modules/**', '**/dist/**'],
	})
}

// a function that finds all of the `package.json` files, and updates their `dependencies` and `devDependencies` all plexusjs packages to the specified version
export function updatePackageJsons(tag = '') {
	const packageJsons = findPackageJsons()
	for (let packageJson of packageJsons) {
		// read & parse the package.json file
		const packageJsonData = JSON.parse(
			readFileSync(packageJson, { encoding: 'utf8' })
		) as PackageJson
		// extract the `dependencies` and `devDependencies` fields
		const { dependencies, devDependencies } = packageJsonData

		// if the package.json file doesn't have a `dependencies` or `devDependencies` field, skip it
		if (!dependencies && !devDependencies) {
			continue
		}

		let foundSome = false
		if (dependencies) {
			for (let dependency in dependencies) {
				if (dependency.startsWith('@plexusjs')) {
					dependencies[dependency] = tag
					foundSome = true
				}
			}
			packageJsonData.dependencies = dependencies
		}
		if (devDependencies) {
			for (let dependency in devDependencies) {
				if (dependency.startsWith('@plexusjs')) {
					devDependencies[dependency] = tag
					foundSome = true
				}
			}
			packageJsonData.devDependencies = devDependencies
		}
		if (foundSome) {
			writeFileSync(packageJson, JSON.stringify(packageJsonData, null, 2))
		}
	}
}

export const installPlexus = (tag = '') => {
	if (yargs.argv['skip-install']) {
		console.log('Skipping Install...')
		return
	}
	// initialize the prefix with npm install syntax
	let installCommand = 'npm install --save'
	// if we have a yarn.lock file or the yarn flag, use yarn to install
	if (existsSync(`${__dirname}/yarn.lock`) || yargs.argv.yarn) {
		console.log(chalk.cyan.bgWhite(`Using Yarn Package Manager`))
		installCommand = 'yarn install'
	} else {
		console.log(chalk.cyan.bgWhite('Using NPM Package Manager'))
	}

	// install the packages
	const tagFinal =
		tag && ['canary', 'latest'].includes(tag)
			? (tag as 'canary' | 'latest')
			: 'latest'

	const version = fetchLatestVersion(tagFinal)
	updatePackageJsons(version)

	tryIt(() => execSync(`${installCommand}`, { stdio: 'inherit' }))
		? console.log(
				chalk.bgGreen.black(
					`Plexus${tag ? `(${tag})` : ``} installed successfully!`
				)
		  )
		: console.error(chalk.bgRed.black('Failed to install Plexus Packages. 😞'))
}
