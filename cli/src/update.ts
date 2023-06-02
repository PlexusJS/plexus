import path from 'path'
import glob from 'glob'

// a function that iterates through the execution directory, finds all of the `package.json` files, and returns their full paths
export function findPackageJsons() {
	return glob.sync(path.join(process.cwd(), '**/package.json'))
}

// a function that finds all of the `package.json` files, and updates their `dependencies` and `devDependencies` all plexusjs packages to the specified version
export function updatePackageJsons(tag = '') {
	const packageJsons = findPackageJsons()
	for (let packageJson of packageJsons) {
		const packageJsonData = require(packageJson)
		const { dependencies, devDependencies } = packageJsonData
		if (dependencies) {
			for (let dependency in dependencies) {
				if (dependency.startsWith('@plexusjs')) {
					dependencies[dependency] = tag
				}
			}
		}
		if (devDependencies) {
			for (let dependency in devDependencies) {
				if (dependency.startsWith('@plexusjs')) {
					devDependencies[dependency] = tag
				}
			}
		}
	}
}

// a function that 