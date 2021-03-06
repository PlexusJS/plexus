/**
 * Simple GraphQL query builder.
 * @param chunks 
 * @param variables 
 * @returns 
 */
export function gql (chunks: TemplateStringsArray, ...variables: any[]): string {
  return chunks.reduce(
    (accumulator, chunk, index) => `${accumulator}${chunk}${index in variables ? variables[index] : ''}`,
    ''
  )
}