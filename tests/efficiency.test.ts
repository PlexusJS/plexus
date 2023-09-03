import { beforeEach, afterEach, describe, test, expect } from 'vitest'
// import { collection, PlexusCollectionInstance } from '@plexusjs/core'
import { Appointment, appointments, User, usersLite, users } from './test-utils'

import {
	randFirstName,
	randUuid,
	randFutureDate,
	randBook,
} from '@ngneat/falso'
import { instance } from '@plexusjs/core'

const users1k = Array.from({ length: 1000 }, () => ({
	id: randUuid(),
	firstName: randFirstName(),
}))
const users10k = Array.from({ length: 10_000 }, () => ({
	id: randUuid(),
	firstName: randFirstName(),
}))
const users1kRelated = Array.from(
	{ length: 1000 },
	() =>
		({
			id: randUuid(),
			firstName: randFirstName(),
			appointmentId: randUuid(),
		}) as User
)

const appointments1kRelated = users1kRelated.map(
	(user) =>
		({
			id: user.appointmentId,
			userId: user.id,
			date: randFutureDate().getTime(),
			name: randBook().title,
		}) as Appointment
)

// check the .cache directory for the generated data. If it doesn't exist, it will be generated. Need users1k.json, users10k.json, users10kRelated.json, appointments10kRelated.json
// const users1kData = require('./.cache/users1k.json')
// const users10kData = require('./.cache/users10k.json')
// const users10kRelatedData = require('./.cache/users10kRelated.json')
// const appointments10kRelatedData = require('./.cache/appointments10kRelated.json')

afterEach(() => {
	usersLite.clear()
	users.clear()
	appointments.clear()
})

describe('Efficiency tests for ', () => {
	test('The speed of a plexus collection collecting more than a thousand randomly generated objects into multiple groups', () => {
		instance({ logLevel: 'debug' })
		console.log('Starting test...')
		console.log('items in collection:', users1k.length)
		usersLite.collect(users1k, ['firstNames'])
		console.log('items in collection:', usersLite.value.length)
		expect(usersLite.value.length).toBe(1000)
		expect(usersLite.groups.firstNames.value.length).toBe(1000)

		instance({ logLevel: undefined })
	})
	test('Testing the same as above but with an absurd amount of data', () => {
		instance({ logLevel: 'debug' })
		console.log('Starting test...')
		console.log('items in collection:', users10k.length)
		usersLite.collect(users10k, ['firstNames'])
		console.log('items in collection:', usersLite.value.length)
		// const group1 = collectionInstance.group('appointmentId')
		// const group2 = collectionInstance.group('name')
		// expect(group1.value.length).toBe(1000)
		// expect(group2.value.length).toBe(1000)
		instance({ logLevel: undefined })
	})
	test('An absurd amount of related data', () => {
		instance({ logLevel: 'debug' })
		console.log('Starting test...')
		console.log('items in collection:', users10k.length)
		users.collect(users1kRelated, ['main'])
		appointments.collect(appointments1kRelated, ['main'])
		console.log('items in collection:', users.value.length)
		// const group1 = collectionInstance.group('appointmentId')
		// const group2 = collectionInstance.group('name')
		// expect(group1.value.length).toBe(1000)
		// expect(group2.value.length).toBe(1000)
		instance({ logLevel: undefined })
	})
})
