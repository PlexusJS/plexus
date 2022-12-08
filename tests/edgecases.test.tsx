import { beforeEach, afterEach, describe, test, expect } from 'vitest'

import {
	batchAction,
	action,
	instance,
	state,
	collection,
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
	test('Batching the `collect` method of related collections', async () => {
		instance({ logLevel: 'debug' })
		const myAction = batchAction(async ({ onCatch }) => {
			onCatch(console.error)

			// #here gets stuck
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

			// #hereEnd
			dummyCollection.collect({ id: 'test' })

			return new Promise<string>((resolve) =>
				setTimeout(() => {
					resolve('')
					console.log('Batched Function Complete!')
				}, 500)
			)
		})

		// the related collection value state should be undefined or something because the batch function hasn't finished yet
		expect(users.getItemValue('1')?.firstName).toBeFalsy()

		// purposely not waiting for the async action to finish
		myAction()
		// the related collection value state should be undefined or something because the batch function hasn't finished yet
		expect(users.getItemValue('1')?.firstName).toBeFalsy()

		await waitFor(
			() => {
				expect(dummyCollection.keys.length).toBe(1)
				expect(users.getItem('1').value?.firstName).toBe('John')
				console.log('batch successful', users.getItemValue('1')?.firstName)
			},
			{ timeout: 1000 }
		)
	})
})
