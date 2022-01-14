import { action, PlexusAction } from '../src'
import { _instance } from '../src/instance';
import { PxState, PxStateInstance } from '../src/interfaces';
let myAction: PlexusAction

describe('Testing Action Function', () => {
	test('Can run a Function', () => {
		const myAction = action(({}) => {
			return "resolved"
		})
		const data = myAction()
		expect(data).toBe("resolved")
	})

	test('Can catch an error', () => {
		const myAction = action(({onCatch}) => {
			onCatch(() => console.log('error caught successfully!'))

			throw new Error('A test error')
		})
		const data = myAction()
		expect(data).toBeDefined()
	})
	
	test('Can handle arguments', () => {
		const myAction = action(({onCatch}, inp: string) => {
			onCatch()
			inp = `input_${inp}` 
			return inp
		})
		const data = myAction('test')
		expect(data).toBe(`input_test`)
	})
	
	test('Can handle async functions', async () => {
		const successMsg = 'waited 100 seconds'
		const myAction = action(async ({onCatch}) => {
			onCatch(console.error)
			return await new Promise(resolve => setTimeout(() => resolve(successMsg), 100))
		})
		const data = await myAction()
		expect(data).toBe(successMsg)
	})
})