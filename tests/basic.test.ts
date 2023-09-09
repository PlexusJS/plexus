import { beforeEach, describe, expect, test } from 'bun:test'
import {
	DEFAULT_DECAY_RATE,
	arrayState,
	objectState,
	stringState,
	decayingUsers,
	myCollection,
	myCollectionUndefined,
} from './test-utils'
import { instance, state } from '@plexusjs/core'

beforeEach(() => {
	stringState.reset()
	objectState.reset()
	arrayState.reset()
})

describe('Collections Core Functionality', () => {
	test('Can create collection', () => {
		expect(myCollection.value.length).toBe(0)
		// can properly collect data
		myCollection.collect({ thing: 'lol', id: 0 })
		expect(myCollection.value.length).toBe(1)
		// myCollection.getSelector("")
		// myCollection.getGroup("group1")
		myCollection.collect([
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])
		console.log('reeeee, myCollection.value', myCollection.value)
		// can return the data values as an array
		expect(myCollection.value[0].thing).toBe('lol')
		expect(myCollection.value[1].thing).toBe('lol3')
		expect(myCollection.value[2].thing).toBe('lols')

		// can properly retrieve data values
		expect(myCollection.getItemValue('0')?.thing).toBe('lol')
		expect(myCollection.getItemValue('2')?.thing).toBe('lol3')
		expect(myCollection.getItemValue('1')?.thing).toBe('lols')

		// does the unfoundKeyReturnsUndefined configuration work
		expect(myCollectionUndefined.getItemValue('1')).toBeUndefined()
		console.log('an undefined object', myCollectionUndefined.getItemValue('1'))
	})

	test('ingest multiple values in collect', () => {
		expect(myCollectionUndefined.getItemValue('1')).toBeUndefined()
		myCollectionUndefined.collect([
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])
		expect(myCollectionUndefined.value.length).toBe(2)
		expect(myCollectionUndefined.value.length).toBe(2)
	})
	test('Does it pass the vibe check ?', () => {
		myCollection.collect({ thing: 'xqcL', id: 0 })
		expect(myCollection.getItem('0').value?.thing).toBe('xqcL')
	})
})

describe('State Core Functionality', () => {
	test('Can save a value', () => {
		const value = state(1)
		expect(value.value).toBe(1)
	})

	test('Change value and remember the old one', () => {
		const value = state(1)
		value.set(2)
		expect(value.value).toBe(2)
		expect(value.lastValue).toBe(1)
	})

	test('Checking state().set()', () => {
		objectState.reset()
		// check .set(value: object)
		objectState.set({ a: { a2: false } })
		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a?.a2).toBe(false)
	})

	test('Checking state().patch()', () => {
		objectState.set({ a: { a1: true, a2: true }, b: true })
		// can the object deep merge?
		objectState.patch({ a: { a2: false } })
		expect(objectState.value.a?.a1).toBe(true)
		// check that other value is still there
		expect(objectState.value.b).toBe(true)
		// changed intended value
		expect(objectState.value.a?.a2).toBe(false)

		// console.log(arrayState.value)
		// check array deep merge
		arrayState.patch([{ item: 'Hello2' }])
		// console.log(arrayState.value)
		expect(arrayState.value[0].item).toBe('Hello2')
		expect(arrayState.value[0].item2).toStrictEqual({ subitem: 'World' })
		expect(arrayState.value[1].item).toBe('Goodbye')
	})

	test('Checking state.watch()', () => {
		let callbackCalled = false

		// can add watcher
		const watcherDestroyer = stringState.watch((value) => {
			console.log('callback called', value)
			callbackCalled = true
		})
		console.log(instance().runtime.engine.events.entries())
		stringState.set('Hello World')
		expect(callbackCalled).toBe(true)
		// can remove watcher
		// stringState.removeWatcher(watcherKey);
		watcherDestroyer()
		// console.log(watcherDestroyer.toString(), instance().runtime.engine.events.entries())
		stringState.set('new value')
		expect(callbackCalled).toBe(true)
	})
})
