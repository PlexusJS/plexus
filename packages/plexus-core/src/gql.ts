/**
 * Simple GraphQL query builder.
 * @param {TemplateStringsArray} chunks The template string chunks
 * @param {any[]} variables The variables to be interpolated into the query
 * @todo Improve type safety
 * @todo Make this work better
 * @returns {string} The built query
 */
export function gql(chunks: TemplateStringsArray, ...variables: any[]): string {
	return chunks.reduce(
		(accumulator, chunk, index) =>
			`${accumulator}${chunk}${index in variables ? variables[index] : ''}`,
		''
	)
}
