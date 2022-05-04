#!/usr/bin/env node
const yargs = require('yargs')
const fs = require('fs')
const { execSync } = require('child_process')

function tryIt(fn) {
	try {
		if (fn instanceof Function) {
			const val = fn()
			if (val !== undefined && val !== null) {
				return val
			}
		}
		return true
	} catch (e) { return false }
}

const genFileOrDir = (arr, path = '/core') => {
	if (!Array.isArray(arr)) { return false }


	for (let obj of arr) {
		const fileName = `${obj.name}.${obj.ext || 'js'}`

		if (obj.type === 'file') {
			tryIt(() => fs.writeFileSync(`${__dirname}${path}/${fileName}`, obj.content)) ? console.log(`Created ${fileName}`) : console.error(`Failed to create ${fileName}`)
		}
		else if (obj.type === 'dir') {
			tryIt(() => fs.mkdirSync(`${__dirname}${path}/${obj.name}`)) ? console.log(`Created ${obj.name}`) : console.error(`Failed to create ${obj.name}`)
			genFileOrDir(obj.content, `${path}/${obj.name}`)
		}
	}
	return true
}
if (yargs.argv.basic) {
	console.log('Creating Basic Plexus setup...')
	if (!yargs.argv["skip-install"]) {

		let prefix = 'npm install --save'
		if (fs.existsSync(`${__dirname}/yarn.lock`)) {
			console.log(`Using Yarn Package Manager ${yargs.argv["skip-install"]
				}`)
			prefix = "yarn add"
		}
		else {
			console.log('Using NPM Package Manager')
		}
		tryIt(() => execSync(`${prefix} @plexusjs/core${yargs.argv.react ? ' @plexusjs/react' : yargs.argv.next ? ' @plexusjs/react @plexusjs/next' : ""}`, { stdio: 'inherit' })) ? console.log('Plexus installed successfully') : console.error('Failed to install Plexus Packages')
	}
	else {
		console.log('Skipping Install...')
	}

	try {
		// make the core directory in the root folder
		tryIt(() => !fs.existsSync(`${__dirname} /core`) && !fs.mkdirSync(`${__dirname}/core`))

		// copy the core files to the core directory
		const structRaw = fs.readFileSync('data/basic.json', { encoding: 'utf8' })

		struct = JSON.parse(structRaw)

		if (yargs.argv.typescript) {
			console.log('Creating TS Files...')
			genFileOrDir(struct?.$schema?.ts, '/core')
		}
		else {
			console.log('Creating JS Files...')
			genFileOrDir(struct?.$schema?.js, '/core')

		}
	}
	catch (e) {
		console.warn(e)
	}
}