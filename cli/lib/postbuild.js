#!/usr/bin/env node
import chalk from 'chalk'
import fs from 'fs'

const upperScriptTag = '#!/usr/bin/env node'

const path = './out/bin.js'
if (fs.existsSync(path)) {
	console.log(chalk.green('Found bin.js file...'))

	const binContent = fs.readFileSync(path, 'utf8')

	if (binContent.includes(upperScriptTag)) {
		console.log(
			chalk.green('bin.js file already has the correct script tag...')
		)
	} else {
		console.log(
			chalk.yellow('bin.js file does not have the correct script tag...')
		)
		console.log(chalk.green('Adding script tag to bin.js file...'))
		fs.writeFileSync(path, upperScriptTag + '\n' + binContent)
		console.log(chalk.green('bin.js file updated!'))
	}
} else {
	console.log(chalk.red('bin.js file not found...'))
}
