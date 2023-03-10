'use strict'
import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { instance, state } from '@plexusjs/core'

type ObjectStateExample = Partial<{
	a: { a?: boolean; b?: boolean }
	b: boolean
	c: { b?: boolean }
}>
type UnionString = 'a' | 'b' | 'c'

const initialValue = {
	boolean: true,
	string: 'Hello Plexus!',
	object: { a: { a: true, b: true }, b: true },
	array: [
		{ item: 'Hello', item2: { subitem: 'World' } },
		{ item: 'Goodbye', item2: { subitem: 'People' } },
	],
	null: null,
}
const booleanState = state(true)
const stringState = state('Hello Plexus!')
const objectState = state<ObjectStateExample>(initialValue.object)
const arrayState = state<{ item?: string; item2?: { subitem?: string } }[]>(
	initialValue.array
)

const stateWithFetchFnTest = state(() => {
	return 'some sort of data'
})
// TODO Disallow null as initial value

beforeEach(() => {
	booleanState.reset()
	stringState.reset()
	objectState.reset()
	arrayState.reset()
})
describe('Testing State Function', () => {
	test('Can save a value', () => {
		const value = state(1)
		const value2 = state<UnionString>('a')
		expect(value.value).toBe(1)
	})

	test('Change value and remember the old one', () => {
		const value = state(1)
		value.set(2)
		expect(value.value).toBe(2)
		expect(value.lastValue).toBe(1)
	})

	test('Checking state().set()', () => {
		// check .set(value: object)
		objectState.set({ a: { b: false } })
		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a?.b).toBe(false)
	})

	test('Checking state().patch()', () => {
		// can the object deep merge?
		objectState.patch({ a: { b: false } })
		expect(objectState.value.a?.a).toBe(true)
		// check that other value is still there
		expect(objectState.value.b).toBe(true)
		// changed intended value
		expect(objectState.value.a?.b).toBe(false)

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

	test('Checking state.watch()', () => {
		let callbackCalled = false
		let callback2Called = false
		// can add watcher
		const watcherDestroyer = stringState.watch((value) => {
			console.log('callback called', value)
			callbackCalled = true
		})
		const watcherDestroyer2 = booleanState.watch((value) => {
			console.log('callback 2 called', value)
			callback2Called = true
		})
		// console.log(instance().runtime.engine.events.entries())
		stringState.set('Hello World')
		expect(callbackCalled).toBe(true)
		expect(callback2Called).toBe(false)

		// can remove watcher
		// stringState.removeWatcher(watcherKey);
		watcherDestroyer()
		// console.log(watcherDestroyer.toString(), instance().runtime.engine.events.entries())
		stringState.set('new value')
		expect(callbackCalled).toBe(true)
	})

	test('Checking state nextValue', () => {
		// check .set(value: object)
		objectState.set({ a: { b: false } })
		objectState.nextValue = { a: { b: true } }

		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a?.b).toBe(false)
		objectState.set()
		expect(objectState.value.a?.b).toBe(true)
		console.log(objectState.value, objectState.nextValue)
		expect(objectState.nextValue).toStrictEqual(objectState.value)
	})

	test('Checking state.reset()', () => {
		// check .set(value: object)
		objectState.set({ a: { b: false } })
		objectState.reset()
		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a?.b).toBe(true)
	})
	test('Checking state.undo() & state.redo()', () => {
		objectState.set({ a: { b: false } })
		objectState.undo()
		expect(objectState.value).toStrictEqual(initialValue.object)
		objectState.redo()
		expect(objectState.value).toStrictEqual({ a: { b: false } })
	})

	test('Checking state history functionality', () => {
		objectState.watch((v) => {
			console.log('Got an update from history change!')
		})
		objectState.history()
		objectState.set({ a: { b: false } })
		console.log('1: checking', objectState.value, 'vs.', { a: { b: false } })
		expect(objectState.value).toStrictEqual({ a: { b: false } })
		objectState.undo()
		console.log('2: checking', objectState.value, 'vs.', initialValue.object)
		expect(objectState.value).toStrictEqual(initialValue.object)
		objectState.redo()
		console.log('3: checking', objectState.value, 'vs.', { a: { b: false } })
		expect(objectState.value).toStrictEqual({ a: { b: false } })

		// checking if the history is working for primitives
		stringState.history()
		new Array(10).fill(null).forEach((_, i) => {
			const nv = `Hello World${i + 1}`
			stringState.set(nv)
			console.log(`${i + 1}: checking`, stringState.value, 'vs.', nv)
			expect(stringState.value).toBe(nv)
		})
		expect(stringState.value).toBe('Hello World10')

		stringState.watch((v) => {
			console.log('Got an update from history change (string state)!')
		})
		new Array(10).fill(null).forEach((_, i, arr) => {
			const nv = `Hello World${arr.length - i}`
			console.log(`${i + 1}: checking`, stringState.value, 'vs.', nv)
			expect(stringState.value).toBe(nv)
			stringState.undo()
		})

		console.log(`undo`)
		stringState.undo()
		expect(stringState.value).toBe('Hello Plexus!')

		console.log(`redo`)
		stringState.redo()
		expect(stringState.value).toBe('Hello World1')

		console.log(`undo`)
		stringState.undo()
		expect(stringState.value).toBe('Hello Plexus!')

		console.log(`redo`)
		stringState.redo()
		expect(stringState.value).toBe('Hello World1')

		console.log('')
		console.log('')

		const complexObj = state({
			obj: {
				arr: [
					{
						item1: 'initial',
					},
				],
			},
		}).history()

		instance({ logLevel: 'debug' })

		expect(complexObj.value.obj.arr[0].item1).toBe('initial')
		complexObj.patch({
			obj: {
				arr: [
					{
						item1: '2',
					},
				],
			},
		})
		expect(complexObj.value.obj.arr[0].item1).toBe('2')

		console.log(`undo`)
		complexObj.undo()
		expect(complexObj.value.obj.arr[0].item1).toBe('initial')

		console.log(`redo`)
		complexObj.redo()
		expect(complexObj.value.obj.arr[0].item1).toBe('2')
		instance({ logLevel: undefined })
	})

	test('Check null initializer functionality', () => {
		expect(stateWithFetchFnTest.value).toBe('some sort of data')
		stateWithFetchFnTest.set('new value')
		expect(stateWithFetchFnTest.value).toBe('new value')
		// let's change the fetcher function!
		stateWithFetchFnTest.defineFetcher(() => {
			// we can do some sort of calculation here
			return 'a new string!' + stateWithFetchFnTest.value
		})
		// awesome! But nothing should change beacuse the state isn't undefined nor did we call `fetch()`
		expect(stateWithFetchFnTest.value).toBe('new value')
		// let's force a fetch...
		stateWithFetchFnTest.fetch()
		expect(stateWithFetchFnTest.value).toBe('a new string!' + 'new value')
	})
})
