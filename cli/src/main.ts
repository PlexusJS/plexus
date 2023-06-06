import chalk from 'chalk'
import yArgs from 'yargs'
import * as fs from 'fs'
// import { execSync } from 'child_process'
// import { TEMPLATES } from './lib/templates'
// import { fetchLatestVersion, lookForCore, tryIt } from './helpers'
// import { updatePackageJsons } from './update'
import { genFiles } from './fsManagement'
import { installPlexus } from './update'
// import { genFileOrDir } from './fsManagement'

const yargs = yArgs(process.argv)
const __dirname = process.cwd()

const helpString = `
	Usage:
		$ npx plexus-cli <command> <options>

	Commands:
		
		module <name>			Create a new module in your plexus core
		update <version>		Update your plexus install

	Options:
		--yarn					Use Yarn as the package manager
		--canary				Use the canary version of plexus
		--dev					Use the dev version of plexus
	    --skip-install			Skip the install of the PlexusJS packages
		--typescript			Create TypeScript files
		--react					Install the React package
		--next					Install the Next package
		--template=<template>	Choose the template to use to generate a PlexusJS core

`

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
