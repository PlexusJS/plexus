import { beforeEach, afterEach, describe, test, expect } from 'vitest'
// import { collection, PlexusCollectionInstance } from '@plexusjs/core'
import { appointments, UserLite, usersLite } from './test-utils'

import { randFirstName, randUuid } from '@ngneat/falso'
import { instance } from '@plexusjs/core'

describe('Efficiency tests for ', () => {
	test('The speed of a plexus collection collecting more than a thousand randomly generated objects into multiple groups', () => {
		const data = Array.from({ length: 1000 }, () => ({
			id: randUuid(),
			firstName: randFirstName(),
		}))

		instance({ logLevel: 'debug' })
		console.log('Starting test...')
		console.log('items in collection:', data.length)
		usersLite.collect(data, ['firstNames'])
		console.log('items in collection:', usersLite.value.length)
		// const group1 = collectionInstance.group('appointmentId')
		// const group2 = collectionInstance.group('name')
		// expect(group1.value.length).toBe(1000)
		// expect(group2.value.length).toBe(1000)
		instance({ logLevel: undefined })
	})
})
