import chalk from 'chalk'
import yArgs from 'yargs'
import * as fs from 'fs'
import { execSync } from 'child_process'
import { TEMPLATES } from './lib/templates'
import { lookForCore, tryIt } from './helpers'

const yargs = yArgs(process.argv)
const __dirname = process.cwd()

const helpString = `
	Usage:
		$ npx create-plexus-core <command> <options>

	Commands:
		
		module <name>			Create a new module in your plexus core
		update --<tag>			Update your plexus install

	Options:
		--canary				Use the canary version of plexus
		--dev					Use the dev version of plexus
	    --skip-install			Skip the install of the PlexusJS packages
		--typescript			Create TypeScript files
		--react					Install the React package
		--next					Install the Next package
		--template=<template>	Choose the template to use to generate a PlexusJS core

`


const genFileOrDir = (arr, path = '/core') => {
	if (!Array.isArray(arr)) {
		return false
	}
	if (typeof path !== 'string') {
		return false
	}

	for (let obj of arr) {
		const fileName = `${obj.name}.${obj.ext || 'js'}`
		let filePath = `${path}/${fileName}`
		let status = 'writing...'
		// if we are creating a file
		if (obj.type === 'file') {
			process.stdout.write(
				`Creating ${chalk.cyan(`"${path}/${fileName}"`)}... ::`
			)
			tryIt(() => fs.writeFileSync(`${__dirname}${filePath}`, obj.content))
				? process.stdout.write(chalk.green(`Success!\n`))
				: process.stdout.write(chalk.yellow(`Failure!\n`))
		}
		// if we are creating a directory
		else if (obj.type === 'dir') {
			process.stdout.write(
				`Creating ${chalk.cyan(`"${path}/${obj.name}/"`)}... ::`
			)
			tryIt(() => fs.mkdirSync(`${__dirname}${path}/${obj.name}`))
				? process.stdout.write(chalk.green(`Success\n`))
				: process.stdout.write(chalk.yellow(`Failed\n`))
			// recurse into the directory
			genFileOrDir(obj.content, `${path}/${obj.name}`)
		}
	}
	return true
}

const installPlexus = (tag = '') => {
	if (!yargs.argv['skip-install']) {
		// initialize the prefix with npm install syntax
		let prefix = 'npm install --save'
		// if we have a yarn.lock file, use yarn to install

		if (fs.existsSync(`${__dirname}/yarn.lock`)) {
			console.log(chalk.cyan.bgWhite(`Using Yarn Package Manager`))
			prefix = 'yarn add'
		} else {
			console.log(chalk.cyan.bgWhite('Using NPM Package Manager'))
		}
		// install the packages
		const tagFinal = tag && ['canary', 'latest'].includes(tag) ? `@${tag}` : ''
		tryIt(() =>
			execSync(
				`${prefix} @plexusjs/core${tagFinal}${
					yargs.argv.react
						? ` @plexusjs/react${tagFinal}`
						: yargs.argv.next
						? ` @plexusjs/react${tagFinal} @plexusjs/next${tagFinal}`
						: ''
				}`,
				{ stdio: 'inherit' }
			)
		)
			? console.log(
					chalk.bgGreen.black(
						`Plexus${tag ? `(${tag})` : ``} installed successfully!`
					)
			  )
			: console.error(
					chalk.bgRed.black('Failed to install Plexus Packages. 😞')
			  )
	} else {
		console.log('Skipping Install...')
	}
}


const genFiles = (template = 'basic') => {
	// check if the template string is one of the available templates
	if (![...Object.keys(TEMPLATES)].includes(template)) {
		console.error(`Template ${template} not found.`)
		return false
	}
	// make the core directory in the root folder
	lookForCore()

	// copy the core files to the core directory
	// const structRaw = fs.readFileSync(`./data/${template}.json`, { encoding: 'utf8' })

	// const struct = JSON.parse(structRaw)
	const struct = TEMPLATES[template]

	if (yargs.argv.typescript || yargs.argv.ts) {
		console.log(chalk.bgWhite.black('Creating TS Files...'))
		genFileOrDir(struct?.$schema?.ts)
	} else {
		console.log(chalk.bgWhite.black('Creating JS Files...'))
		genFileOrDir(struct?.$schema?.js)
	}
}

function run() {
	let commandRan = false

	if (yargs.argv._[2] === 'module') {
		if (yargs.argv._[1]) {
		}
		return
	}
	if (yargs.argv._[2] === 'update') {
		if (yargs.argv.canary) {
			console.log(
				chalk.bgWhite.black('Updating PlexusJS to latest Canary build...')
			)
			installPlexus('canary')
		} else if (yargs.argv.latest) {
			console.log(
				chalk.bgWhite.black('Updating PlexusJS to Latest stable build...')
			)
			installPlexus('latest')
		} else {
			installPlexus()
		}
		commandRan = true
		return
	}

	// parse the command line arguments
	if (yargs.argv.template) {
		// try installing the packages
		installPlexus()

		// generate the core files
		if (
			typeof yargs.argv.template === 'string' ||
			yargs.argv.template === undefined
		) {
			try {
				switch (yargs.argv.template) {
					case 'scalable': {
						console.log('Using Scalable Template...')
						genFiles('scalable')
						break
					}
					default: {
						console.log('Using Basic Template...')
						genFiles()
						break
					}
				}
			} catch (e) {
				console.warn(e)
			}
		} else {
			console.warn('Invalid Template')
		}
		commandRan = true
		return
	}

	if (!commandRan) {
		console.log(helpString)

		return
	}
}

run()
