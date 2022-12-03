import { collection, computed, instance, state } from '@plexusjs/core'
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
