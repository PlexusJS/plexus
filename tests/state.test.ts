'use strict'
import { beforeEach, afterEach, describe, test, expect } from 'bun:test'
import { instance, state } from '@plexusjs/core'
import {
	initialStateValues,
	stateWithFetchFnTest,
	arrayState,
	booleanState,
	objectState,
	stringState,
} from './test-utils'

beforeEach(() => {
	booleanState.reset()
	stringState.reset()
	objectState.reset()
	arrayState.reset()
})
describe('Testing State Function', () => {
	test('Checking state.watch()', () => {
		let callbackCalled = false
		let callback2Called = false
		// can add watcher
		const watcherDestroyer = stringState.watch((value) => {
			console.log('callback called', value)
			callbackCalled = true
		})
		// console.log(instance().runtime.engine.events.entries())
		stringState.set('Hello World')
		expect(callbackCalled).toBe(true)
		expect(callback2Called).toBe(false)

		// can remove watcher
		watcherDestroyer()
		stringState.set('new value')
		expect(callbackCalled).toBe(true)
	})

	test('Checking state nextValue', () => {
		// check .set(value: object)
		objectState.set({ a: { a2: false } })
		objectState.nextValue = { a: { a2: true } }

		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a?.a2).toBe(false)
		objectState.set()
		expect(objectState.value.a?.a2).toBe(true)
		console.log(objectState.value, objectState.nextValue)
		expect(objectState.nextValue).toStrictEqual(objectState.value)
	})

	test('Checking state.reset()', () => {
		// check .set(value: object)
		objectState.set({ a: { a2: false } })
		objectState.reset()
		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a?.a2).toBe(true)
	})
	test('Checking state.undo() & state.redo()', () => {
		objectState.set({ a: { a2: false } })
		objectState.undo()
		expect(objectState.value).toStrictEqual(initialStateValues.object)
		objectState.redo()
		expect(objectState.value).toStrictEqual({ a: { a2: false } })
	})

	test('Checking state history functionality', () => {
		objectState.watch((v) => {
			console.log('Got an update from history change!')
		})
		objectState.history()
		objectState.set({ a: { a2: false } })
		console.log('1: checking', objectState.value, 'vs.', { a: { a2: false } })
		expect(objectState.value).toStrictEqual({ a: { a2: false } })
		objectState.undo()
		console.log(
			'2: checking',
			objectState.value,
			'vs.',
			initialStateValues.object
		)
		expect(objectState.value).toStrictEqual(initialStateValues.object)
		objectState.redo()
		console.log('3: checking', objectState.value, 'vs.', { a: { a2: false } })
		expect(objectState.value).toStrictEqual({ a: { a2: false } })

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
		// awesome! But nothing should change because the state isn't undefined nor did we call `fetch()`
		expect(stateWithFetchFnTest.value).toBe('new value')
		// let's force a fetch...
		stateWithFetchFnTest.fetch()
		expect(stateWithFetchFnTest.value).toBe('a new string!' + 'new value')
	})
	test('persist', () => {
		const value = state(1).persist('test')
		expect(value.value).toBe(1)
	})
})
