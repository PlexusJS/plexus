import chalk from 'chalk'
import { lookForCore, tryIt } from './helpers'
import { mkdirSync, writeFileSync } from 'fs'
import { TEMPLATES } from './lib/templates'
import yArgs from 'yargs'
const yargs = yArgs(process.argv)
const __dirname = process.cwd()

export const genFileOrDir = (arr, path = '/core') => {
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
			tryIt(() => writeFileSync(`${__dirname}${filePath}`, obj.content))
				? process.stdout.write(chalk.green(`Success!\n`))
				: process.stdout.write(chalk.yellow(`Failure!\n`))
		}
		// if we are creating a directory
		else if (obj.type === 'dir') {
			process.stdout.write(
				`Creating ${chalk.cyan(`"${path}/${obj.name}/"`)}... ::`
			)
			tryIt(() => mkdirSync(`${__dirname}${path}/${obj.name}`))
				? process.stdout.write(chalk.green(`Success\n`))
				: process.stdout.write(chalk.yellow(`Failed\n`))
			// recurse into the directory
			genFileOrDir(obj.content, `${path}/${obj.name}`)
		}
	}
	return true
}

export const genFiles = (template = 'basic') => {
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
