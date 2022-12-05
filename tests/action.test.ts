import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { action, collection, state } from '@plexusjs/core'
const stringState = state<string>('init')
const dummyCollection = collection();

describe('Testing Action Function', () => {
	test('Can run a Function', () => {
		const myAction = action(({}) => {
			return 'resolved'
		})
		const data = myAction()
		expect(data).toBe('resolved')
	})

	test('Can catch an error', () => {
		const myAction = action(({ onCatch }) => {
			onCatch(() => console.log('error caught successfully!'))

			throw new Error('A test error')
		})
		const data = myAction()
		expect(data).toBeDefined()
	})

	test('Can handle arguments', () => {
		const myAction = action(({ onCatch }, inp: string) => {
			onCatch()
			inp = `input_${inp}`
			return inp
		})
		const data = myAction('test')
		expect(data).toBe(`input_test`)
	})

	test('Can handle async functions', async () => {
		const successMsg = 'waited 100 seconds'
		const myAction = action(async ({ onCatch }) => {
			onCatch(console.error)
			return await new Promise((resolve) =>
				setTimeout(() => resolve(successMsg), 100)
			)
		})
		const data = await myAction()
		expect(data).toBe(successMsg)
	})

	test('Can handle batching', async () => {
		const successMsg = 'waited 100 seconds'
		stringState.set('init')

		const kill = stringState.watch((val) => {
			console.log('watcher called', val)
			expect(val).toBe(successMsg)
		})
		const myAction = action(async ({ onCatch, batch }) => {
			onCatch(console.error)
			batch(async () => {
				console.log('batched!')
				stringState.set(successMsg)
				dummyCollection.collect({ id: 'test' })
				await new Promise((resolve) =>
					setTimeout(() => resolve(successMsg), 100)
				)
			})
			return
		})
		const data = await myAction()
		// the string state should be 'init' because the batch function hasn't finished yet
		expect(stringState.value).toBe('init')
		setTimeout(() => {
			expect(stringState.value).toBe(successMsg)
			expect(dummyCollection.keys.length).toBe(1)
		}, 100)

		kill()
	})
})
