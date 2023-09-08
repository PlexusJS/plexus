import { beforeEach, afterEach, describe, test, expect } from 'vitest'

import {
	batchAction,
	instance,
	collection,
	batch,
	action,
	computed,
	state,
} from '@plexusjs/core'
import { appointments, users, waitFor } from './test-utils'

const dummyCollection = collection()
beforeEach(() => {
	dummyCollection.clear()
	appointments.clear()
	users.clear()
})

describe('Collection Relations', () => {
	// this is caused by collection groups having automatic batching. Maybe an issue with nested batch calls? A race condition?
	test(
		'Batching the `collect` method of related collections',
		async () => {
			instance({ logLevel: 'debug' })
			await new Promise<string>((resolve) => {
				setTimeout(() => {
					console.log('0 timeout done!')
					resolve('')
				}, 0)
			})
			const myAction = action(async ({ batch, onCatch }) => {
				onCatch(console.error)

				return await batch(async function () {
					console.log('Batching Function Start!')

					users.collect({
						id: '1',
						firstName: 'John',
						appointmentId: '1',
					})
					users.selectors.batched.select('1')
					appointments.collect({
						id: '1',
						name: 'test',
						date: 123,
						userId: '1',
					})

					dummyCollection.collect({ id: 'test' })
					return new Promise((resolve) => {
						setTimeout(() => {
							console.log('timeout done!')
							resolve('')
						}, 500)
					})
				})
				// return new Promise((resolve) => {
				// 	setTimeout(() => {
				// 		console.log('timeout done!')
				// 		resolve(val)
				// 	}, 500)
				// })
			})

			// the related collection value state should be undefined or something because the batch function hasn't finished yet
			expect(users.getItemValue('1')?.firstName).toBeFalsy()

			// purposely not waiting for the async action to finish
			myAction()
			// #here gets stuck
			// the related collection value state should be undefined because the batch function hasn't finished yet
			expect(users.getItemValue('1')?.firstName).toBeFalsy()

			await waitFor(
				() => {
					expect(dummyCollection.keys.length).toBe(1)
					expect(users.getItem('1').value?.firstName).toBe('John')
					expect(users.selectors.batched.value?.firstName).toBe('John')
					console.log('batch successful', users.getItemValue('1')?.firstName)
					console.log('batch successful', users.selectors.batched.value)
				},
				{ timeout: 1000 }
			)
		},
		{ timeout: 10000 }
	)

	test('Batching race condition with selectors', () => {
		batch(() => {})
	})
})

describe('Weird Edge Cases', () => {
	test('Computed instance watching a selector with provisional data', () => {
		const myCollection = collection().createSelector('main', '1')
		const myComputed = computed(
			() => myCollection.selectors.main.value?.name,
			[myCollection.selectors.main]
		)

		myCollection.collect({ id: '1', name: 'test' })
		expect(myComputed.value).toBe('test')
	})

	test('Batching a state set', () => {
		const myState = state('')
		const myAction = action(({ batch }) => {
			batch(() => {
				myState.set('test')
			})
		})

		myAction()
		expect(myState.value).toBe('test')
	})
})
