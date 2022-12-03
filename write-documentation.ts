'use strict'
import jsdoc2md from 'jsdoc-to-markdown'
import read from 'fs-readdir-recursive'
import fs from 'fs'
import path from 'path'
import c from 'chalk'

const SETTINGS = {
	VERBOSE: false,
}
interface Identifier {
	id: string
	longname: string
	name: string
	kind: 'function' | 'class' | 'method'
	scope: 'instance' | 'global'
	description: string
	memberof: string
	thisvalue: undefined
	order: number
	params: {
		description: string
		name: string
	}[]
	meta: {
		lineno: number
		filename: string
		path: string
	}
}
type PackageMap = Record<string, { absolute: string; relative: string }[]>
type TokenMap = Record<string, string> & {
	name: string
	identifierKey: string
	description: string
}

const outputDir = path.join(__dirname, 'docs/docs/api-reference')
const docTemplateClass = fs.readFileSync(
	`${__dirname}/scripts/templates/ref.hbs`,
	'utf8'
)
const docTemplateFunction = fs.readFileSync(
	`${__dirname}/scripts/templates/fn.hbs`,
	'utf8'
)

const writeDocFromIdentifier = (
	identifier: Identifier,
	templateData: Identifier[],
	absoluteInputFiles: string[]
) => {
	try {
		console.log(`Generating docs for`, c.yellow(identifier.name), `\n`)

		let formattedDocTemplate =
			identifier.kind === 'class' ? docTemplateClass : docTemplateFunction

		const foundTokens = formattedDocTemplate.match(/\$\{(\w|\d|-|_)*\}/g)
		SETTINGS.VERBOSE &&
			console.log(c.yellow(`Found top-level Template Tokens:`), foundTokens)

		// A map to store all the identifiers that are used in the template
		const tokenMap: TokenMap = {
			name: identifier.name,
			identifierKey: identifier.name,
			description: identifier.description,
		}

		// generate the md file data
		let fileData = jsdoc2md.renderSync({
			files: absoluteInputFiles,
			template: formattedDocTemplate.replace(
				'${identifierKey}',
				tokenMap.identifierKey || ''
			),
			data: templateData,
			partial: `${__dirname}/scripts/templates/**/*.hbs`,
		})

		// replace all tokens in the returned data
		foundTokens?.forEach((token) => {
			fileData = fileData.replace(
				token,
				tokenMap[token.substring(2, token.length - 1)] || ''
			)
		})

		// Write the file
		fs.writeFileSync(
			path.resolve(outputDir, `${identifier.name || new Date().getTime()}.mdx`),
			fileData
		)
		//   process.stdout.moveCursor(0, -1)
		process.stdout.write('✅\n')
	} catch (err) {
		//   process.stdout.moveCursor(0, -1)
		process.stdout.write('❌\n')
	}
}
const start = async () => {
	console.log(c.blue('\n\n- Initialization 🚩\n'))
	/* input and output paths */

	const inputFiles = read(path.join(__dirname, './packages'))
	const packageMap: PackageMap = {}
	SETTINGS.VERBOSE &&
		console.log(c.yellow(inputFiles.length), `files in core packages...`)

	inputFiles.forEach((filePath) => {
		if (/.*\/src\/.*/g.test(filePath)) {
			// the package name is the first part of the path
			const packageName = filePath.split('/')[0]
			if (!packageMap[packageName]) {
				packageMap[packageName] = []
			}
			packageMap[packageName]?.push({
				absolute: path.join(__dirname, '/packages/', filePath),
				relative: filePath,
			})
		}
	})

	// ! this is sooo inefficient lmao
	const absoluteInputFiles = Object.values(packageMap)
		.map((packagePaths) =>
			packagePaths.map((packagePath) => packagePath.absolute)
		)
		.flat()

	console.log(
		`Found`,
		c.yellowBright(`${absoluteInputFiles.length} files`),
		`in these packages:`,
		Object.keys(packageMap)
	)

	console.log(c.blue('\n\n- Start Processing ⚙️\n'))
	// casting required due to poor typing on this package
	const templateData: Identifier[] = jsdoc2md.getTemplateDataSync({
		files: absoluteInputFiles,
		configure: './jsdoc2md.json',
	}) as any[]

	// extract all identifiers from the template data
	const classIdentifiers = templateData
		.reduce((classData: Identifier[], identifier: Identifier) => {
			if (identifier.kind === 'class') classData.push(identifier)
			return classData
		}, [] as Identifier[])
		.map((identifier) => {
			const text = identifier.description?.replace(/<\/?[^>]+>/gi, '') || ''
			return {
				...identifier,
				description: text,
			}
		})

	const functionIdentifiers = templateData
		.reduce((classData: Identifier[], identifier: Identifier) => {
			if (identifier.kind === 'function' && identifier.scope === 'global')
				classData.push(identifier)
			return classData
		}, [] as Identifier[])
		.map((identifier) => {
			const text = identifier.description?.replace(/<\/?[^>]+>/gi, '') || ''
			return {
				...identifier,
				description: text,
			}
		})
	// console.log(classIdentifiers)
	SETTINGS.VERBOSE &&
		console.log(
			c.yellow('Found these classes:'),
			classIdentifiers.map((data) => data.name)
		)
	SETTINGS.VERBOSE &&
		console.log(
			c.yellow('Found these functions:'),
			functionIdentifiers.map((data) => data.name)
		)

	// write the docs for top level function
	for (const identifier of functionIdentifiers) {
		writeDocFromIdentifier(identifier, templateData, absoluteInputFiles)
	}
	// generate docs for each class
	for (let identifier of classIdentifiers) {
		writeDocFromIdentifier(identifier, templateData, absoluteInputFiles)
	}
}

// run the script
start()
	.then(() => {
		console.log(
			c.green(`\n\n- Documentation Generated 🚀`),
			`(in "${outputDir}")\n`
		)
	})
	.catch((err) => {
		console.error(c.red(`\n\n- Documentation Generation Failed ❌`), err)
		process.exit(1)
	})
