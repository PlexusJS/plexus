import { beforeEach, afterEach, describe, test, expect } from 'vitest'

import {
	batchAction,
	instance,
	collection,
	batch,
	action,
	computed,
	controller,
	state,
} from '@plexusjs/core'
import { appointments, users, waitFor } from './test-utils'

const dummyCollection = collection()
beforeEach(() => {
	dummyCollection.clear()
	appointments.clear()
	users.clear()
})

describe('Controller Basics', () => {
	// test('can a controller be used', () => {
	// 	const myModule = controller({
	// 		myState: state('hey there'),
	// 	}).export()

	// 	expect(myModule.myState).toBeDefined()
	// 	expect(myModule.myState.value).toBe('hey there')
	// })
	test('can a controller be used with .module', () => {
		const myModule = controller({
			myState: state('hey there'),
		}).module

		expect(myModule.myState).toBeDefined()
		expect(myModule.myState.value).toBe('hey there')
	})

	test('Can you edit a watchable from a .module call', () => {
		const myModule = controller({
			myState: state('hey there'),
		}).module

		expect(myModule.myState).toBeDefined()
		expect(myModule.myState.value).toBe('hey there')
		myModule.myState.set('new value')
		expect(myModule.myState.value).toBe('new value')
	})

	test('Can you edit a collection from a .module call', () => {
		const myModule = controller({
			myCollection: collection(),
		}).module

		expect(myModule.myCollection).toBeDefined()
		expect(myModule.myCollection.value).toEqual([])
		myModule.myCollection.collect({ id: '1', name: 'test' })
		expect(myModule.myCollection.value).toEqual([{ id: '1', name: 'test' }])
		expect(myModule.myCollection.name).toBe('myCollection')
	})
})
