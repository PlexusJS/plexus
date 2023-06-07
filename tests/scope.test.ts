import { beforeEach, afterEach, describe, test, expect } from 'vitest'
// import { collection, PlexusCollectionInstance } from '@plexusjs/core'
import { appointments, UserLite, usersLite } from './test-utils'

import { randFirstName, randUuid } from '@ngneat/falso'
import { instance, scope } from '@plexusjs/core'

const definedScope = scope('test')

type UnionStringType = 'a' | 'b' | 'c'

const myScopedString = definedScope.state('default value')
const myScopedString2 = definedScope.state<UnionStringType>('a')

beforeEach(() => {
	myScopedString.set('new value')
})

afterEach(() => {
	usersLite.clear()
})

describe('Efficiency tests for ', () => {
	test('Does a scoped watchable work?', () => {
		expect(myScopedString.value).toBe('new value')
		myScopedString.set('new value 2')
		expect(myScopedString.value).toBe('new value 2')
	})
	test('Does a scoped watchable work with an override type?', () => {
		expect(myScopedString2.value).toBe('a')
		myScopedString2.set('b')
		expect(myScopedString2.value).toBe('b')
	})
})
