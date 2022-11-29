'use strict'
import jsdoc2md from 'jsdoc-to-markdown'
import read from 'fs-readdir-recursive'
import fs from 'fs'
import path from 'path'

/* input and output paths */

const inputFiles = read(path.join(__dirname, './packages'))
const outputDir = path.join(__dirname, 'docs/docs/api-reference')
const docTemplate = fs.readFileSync(
    `${__dirname}/scripts/templates/ref.hbs`,
    'utf8'
)
console.log('input', inputFiles)

const packageMap: Record<string, { absolute: string; relative: string }[]> = {}

inputFiles.forEach((filePath) => {
    if (/.*\/src\/(?!index.ts($|\s))/g.test(filePath)) {
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
/* reduce templateData to an array of class names */
// for (let file of packageMap) {
// 	const templateData = jsdoc2md.getTemplateDataSync({
// 		files: Array.from(file[1].values()),
// 		configure: "./jsdoc2md.json",
// 	})
// 	/* reduce templateData to an array of class names */
// 	const classNames = templateData.reduce((classNames: string[], identifier: any) => {
// 		if (identifier.kind === "class") classNames.push(identifier.name)
// 		return classNames
// 	}, [])
// 	console.log("templateData", templateData)
// 	const fileData = jsdoc2md
// 		.renderSync({
// 			files: Array.from(file[1].values()),
// 			template: template,
// 			data: templateData,
// 		})
// 		.replace("${name}", file[0])
// 	console.log("fileData", fileData)
// 	fs.writeFileSync(path.resolve(outputDir, `${file[0] || new Date().getTime()}.md`), fileData)
// }

// ! this is sooo inefficient lmao
const absoluteInputFiles = Object.values(packageMap)
    .map((packagePaths) =>
        packagePaths.map((packagePath) => packagePath.absolute)
    )
    .flat()
console.log('trimmed', packageMap, absoluteInputFiles)
const templateData = jsdoc2md.getTemplateDataSync({
    files: absoluteInputFiles,
    configure: './jsdoc2md.json',
})
const classNames = templateData.reduce(
    (classNames: string[], identifier: any) => {
        console.log('identifier', identifier)
        if (identifier.kind === 'class') classNames.push(identifier.name)
        return classNames
    },
    []
)
for (let className of classNames) {
    console.log('className', className)
    /* reduce templateData to an array of class names */
    // console.log("templateData", templateData)
    const template = `${docTemplate}\n{{#class name="${className}"}}{{>docs}}{{/class}}`
    const fileData = jsdoc2md
        .renderSync({
            files: absoluteInputFiles,
            template: template,
            data: templateData,
        })
        .replace('${name}', className)
    // console.log("fileData", fileData)
    fs.writeFileSync(
        path.resolve(outputDir, `${className || new Date().getTime()}.md`),
        fileData
    )
}
