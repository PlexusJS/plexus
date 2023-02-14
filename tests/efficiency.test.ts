import { beforeEach, afterEach, describe, test, expect } from 'vitest'
// import { collection, PlexusCollectionInstance } from '@plexusjs/core'
import { appointments, users } from './test-utils'

import { randFirstName, randLastName } from '@ngneat/falso'
const data = new Array(1000).map((_, i) => ({
	id: 'id' + i,
	name: randFirstName() + ' ' + randLastName(),
	appointmentId:
		appointments[Math.floor(Math.random() * appointments.length)].id,
}))

describe('Efficiency tests for ', () => {
	test('The speed of a plexus collection collecting more than a thousand randomly generated objects into multiple groups', () => {
		users.collect(data, [])
		// const group1 = collectionInstance.group('appointmentId')
		// const group2 = collectionInstance.group('name')
		// expect(group1.value.length).toBe(1000)
		// expect(group2.value.length).toBe(1000)
	})
})
