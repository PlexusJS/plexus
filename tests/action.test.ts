import { beforeEach, afterEach, describe, test, expect } from 'vitest'

import { action, instance, state, collection } from '@plexusjs/core'
import { appointments, users, waitFor } from './test-utils'

const stringState = state<string>('init')
const dummyCollection = collection()

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

		instance({ logLevel: 'debug' })

		const kill = stringState.watch((val) => {
			console.log('watcher called', val)
			expect(val).toBe(successMsg)
		})
		const myAction = action(async ({ onCatch, batch }) => {
			onCatch(console.error)
			await batch(() => {
				users.collect({
					id: '1',
					firstName: 'John',
					appointmentId: '1',
				})
				appointments.collect({
					id: '1',
					name: 'test',
					date: 123,
					userId: '1',
				})
				console.log('batched!')
				stringState.set(successMsg)
				dummyCollection.collect({ id: 'test' })
				return new Promise((resolve) =>
					setTimeout(() => resolve(successMsg), 900)
				)
			})
			return
		})

		// the string state should be 'init' because the batch function hasn't finished yet
		expect(stringState.value).toBe('init')
		expect(users.getItemValue('1')?.firstName).toBeFalsy()

		// purposely not waiting for the async action to finish
		myAction()

		// the string state should be 'init' because the batch function hasn't finished yet
		expect(stringState.value).toBe('init')
		expect(users.getItemValue('1')?.firstName).toBeFalsy()

		await waitFor(
			() => {
				console.log('finished waiting!')
				expect(dummyCollection.keys.length).toBe(1)
				expect(stringState.value).toBe(successMsg)
				expect(users.getItem('1').value?.firstName).toBe('John')
				console.log('batch successful', users.getItemValue('1')?.firstName)
				kill()
			},
			{ timeout: 1000 }
		)
	})
})
