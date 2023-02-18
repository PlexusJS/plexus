import { beforeEach, afterEach, describe, test, expect } from 'vitest'
// import { collection, PlexusCollectionInstance } from '@plexusjs/core'
import { appointments, UserLite, usersLite } from './test-utils'

import { randFirstName, randUuid } from '@ngneat/falso'
import { instance } from '@plexusjs/core'

let users: any
let usersLarge: any

beforeEach(() => {
	users = Array.from({ length: 1000 }, () => ({
		id: randUuid(),
		firstName: randFirstName(),
	}))
	usersLarge = Array.from({ length: 10000 }, () => ({
		id: randUuid(),
		firstName: randFirstName(),
	}))
})

afterEach(() => {
	usersLite.clear()
})

describe('Efficiency tests for ', () => {
	test('The speed of a plexus collection collecting more than a thousand randomly generated objects into multiple groups', () => {
		// instance({ logLevel: 'debug' })
		console.log('Starting test...')
		console.log('items in collection:', users.length)
		usersLite.collect(users, ['firstNames'])
		console.log('items in collection:', usersLite.value.length)
		expect(usersLite.value.length).toBe(1000)
		expect(usersLite.groups.firstNames.value.length).toBe(1000)

		// instance({ logLevel: undefined })
	})
	test('Testing the same as above but with an absurd amount of data', () => {
		// instance({ logLevel: 'debug' })
		console.log('Starting test...')
		console.log('items in collection:', usersLarge.length)
		usersLite.collect(usersLarge, ['firstNames'])
		console.log('items in collection:', usersLite.value.length)
		// const group1 = collectionInstance.group('appointmentId')
		// const group2 = collectionInstance.group('name')
		// expect(group1.value.length).toBe(1000)
		// expect(group2.value.length).toBe(1000)
		// instance({ logLevel: undefined })
	})
})
