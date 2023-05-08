import { collection, computed, instance, state } from '@plexusjs/core'
import { deepClone, deepMerge, isAsyncFunction, convertStringToThing, convertThingToString } from '@plexusjs/utils'
import { beforeEach, afterEach, describe, test, expect } from 'vitest'

const myState = state('')
const myCollection = collection()

const myComputed = computed(() => {
	return myState.value.split('').join('-')
}, [myState])
afterEach(() => {
	myState.reset()
	myCollection.clear()
	myComputed.reset()
})
describe('Test Instance generation, manipulation and ', () => {
	test('', () => {
		console.log(myState.value)

		myState.set('hello')
		myCollection.collect({ id: '1', dad: 'bob' })
		console.log(myState.value)
		expect(myState.value).toBe('hello')
		expect(myComputed.value).toBe('h-e-l-l-o')

		console.log(instance())

		expect(instance()._computedStates.size).toBe(1)
		expect(instance()._collections.size).toBe(1)
		expect(instance()._states.size).toBe(1)
	})
})

describe('Test helper functions from the utils module', () => {
	test('Test deepClone', () => {
		const obj = { a: 1, b: { c: 2 } }
		const cloned = deepClone(obj)
		expect(cloned).toEqual(obj)
		expect(cloned).not.toBe(obj)
		expect(cloned.b).not.toBe(obj.b)
	})
	test('Test deepMerge', () => {
		const obj1 = { a: 1, b: { c: 2 } }
		const obj2 = { a: 2, b: { c: 3 } }
		const merged = deepMerge(obj1, obj2)
		expect(merged).toEqual({ a: 2, b: { c: 3 } })
		expect(merged).not.toBe(obj1)
		expect(merged.b).not.toBe(obj1.b)
		expect(merged.b).not.toBe(obj2.b)

		// Test with deep arrays
		const obj3 = { a: 1, b: { c: [1, 2, 3] } }
		const obj4 = { a: 2, b: { c: [4, 5, 6] } }
		const merged2 = deepMerge(obj3, obj4)
		expect(merged2).toEqual({ a: 2, b: { c: [4, 5, 6] } })
		expect(merged2).not.toBe(obj3)
		expect(merged2.b).not.toBe(obj3.b)
		expect(merged2.b).not.toBe(obj4.b)
		expect(merged2.b.c).not.toBe(obj3.b.c)

		// Test with deep arrays holding objects and arrays
		const obj5 = { a: 1, b: { c: [1, 2, { d: 1, e: [1, 2, 3] }] } }
		const obj6 = { a: 2, b: { c: [4, 5, { d: 2, e: [4, 5, 6] }] } }
		const merged3 = deepMerge(obj5, obj6)
		expect(merged3).toEqual({ a: 2, b: { c: [4, 5, { d: 2, e: [4, 5, 6] }] } })
		expect(merged3).not.toBe(obj5)
		expect(merged3.b).not.toBe(obj5.b)
		expect(merged3.b).not.toBe(obj6.b)

	})
	test('Test isAsyncFunction', () => {
		expect(isAsyncFunction(async () => { })).toBe(true)
		expect(isAsyncFunction(() => { })).toBe(false)
	})
	test('Test convertStringToThing', () => {
		expect(convertStringToThing('{"a":1}')).toEqual({ a: 1 })
		expect(convertStringToThing('{"a":1}')).not.toBe({ a: 1 })
	})
	test('Test convertThingToString', () => {
		expect(convertThingToString({ a: 1 })).toEqual('{"a":1}')
		expect(convertThingToString({ a: 1 })).not.toBe('{"a":1}')
	})
})

