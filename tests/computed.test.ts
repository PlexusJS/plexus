import { beforeEach, afterEach, describe, test, expect } from 'vitest'

import {
	collection,
	computed,
	instance,
	PlexusComputedStateInstance,
	PlexusStateInstance,
	state,
} from '@plexusjs/core'
// import { PlexusState, PlexusStateInstance } from '../src/interfaces';

// instance({ logLevel: "debug" })
const states = {
	stringState: state<string>('Hello Plexus!'),
	numberState: state(-1),
}
const collections = {
	books: collection<{
		name: string
		pages: number
		sku: string
	}>({ primaryKey: 'sku', defaultGroup: 'all' })
		.createSelector('READING')
		.createGroup('READING'),
}
const core = {
	state: states,
	collections,
	computedState: computed(() => {
		// console.log(`Looking at ${stringState.value}`)
		states.numberState.set(states.stringState.value.length)
		// console.log(`computed to: ${booleanState.value}`)
		return states.stringState.value.length
	}, [states.stringState, collections.books.selectors.READING]),

	readingBookComputation: computed(() => {
		return collections.books.selectors.READING.value?.pages
	}, [collections.books.selectors.READING]),

	numOfReading: computed(() => {
		return collections.books.groupsValue.READING.length
	}, [
		collections.books.getSelector('READING'),
		collections.books.getGroup('READING'),
	]),

	numOfAll: computed(() => {
		return collections.books.getGroup('all').value.length
	}, [collections.books.getGroup('all')]),

	numOfReadingReactiveToAll: computed(() => {
		console.log(
			'numOfReadingReactiveToAll compute...',
			collections.books.getGroup('READING').value.length,
			collections.books.getGroup('all').value.length
		)
		return collections.books.getGroup('READING').value.length
	}, [collections.books.getGroup('all')]),
}

beforeEach(() => {
	core.state.stringState.set('Hello Plexus! (initialized)')
	core.state.numberState.set(1)
})
afterEach(() => {
	core.state.stringState.reset()
	core.state.numberState.reset()
})

describe('Testing Computed State Function', () => {
	test('Can INITIALIZE a computed state value', () => {
		expect(core.computedState.value).toBe('Hello Plexus! (initialized)'.length)
	})
	test('Can UPDATE a computed state value', () => {
		console.log(`Looking at stringState ${core.state.stringState.value}`)
		core.state.stringState.set('daasw')
		expect(core.state.stringState.value).toBe('daasw')

		expect(core.computedState.value).toBe(5)
		core.state.stringState.set('')
		expect(core.state.numberState.value).toBe(0)
		expect(core.computedState.value).toBe(0)
	})
	test('Can WATCH a computed state value', () => {
		// console.log(`Looking at ${stringState.value}`)
		core.computedState.watch((v) => {
			console.log('computedState.value changed to: ', v)
		})
		core.state.stringState.set('daasw')

		expect(core.state.stringState.value).toBe('daasw')

		expect(core.computedState.value).toBe(5)
		core.state.stringState.set('')
		expect(core.state.numberState.value).toBe(0)
		expect(core.computedState.value).toBe(0)
	})

	test('Computed can watch a collection selector', () => {
		core.collections.books.collect({
			name: 'James Bond',
			pages: 12,
			sku: 't6sawo4bjhkv47839d3',
		})

		core.collections.books.selectors.READING.select('t6sawo4bjhkv47839d3')

		core.readingBookComputation.watch((v) => {
			console.log('readingBookComputation.value changed to: ', v)
		})

		expect(core.readingBookComputation.value).toBe(12)
	})
	test('Computed can watch a collection group', () => {
		core.numOfReading.watch((v) => {
			console.log('numOfReading.value changed to: ', v)
		})
		core.collections.books.collect(
			{
				name: 'James Bond',
				pages: 12,
				sku: 't6sawo4bjhkv47839d3',
			},
			['READING']
		)

		expect(core.numOfReading.value).toBe(1)

		core.collections.books.delete('t6sawo4bjhkv47839d3')

		expect(core.numOfReading.value).toBe(0)
	})
	test('Computed can watch a default collection group', () => {
		instance({ logLevel: 'debug' })
		// start watching the reading group
		collections.books.getGroup('READING')?.watch((v) => {
			console.log('READING changed to: ', v)
		})
		collections.books.getGroup('all')?.watch((v) => {
			console.log('ALL changed to: ', v)
		})
		// start watching the computed state that is watching the reading group
		core.numOfReadingReactiveToAll.watch((v) => {
			console.log('numOfReadingReactiveToAll.value changed to: ', v)
		})
		core.collections.books.collect(
			{
				name: 'James Bond',
				pages: 12,
				sku: 't6sawo4bjhkv47839d3',
			},
			['READING']
		)

		expect(core.numOfReadingReactiveToAll.value).toBe(1)

		core.collections.books.delete('t6sawo4bjhkv47839d3')
		console.log(
			'numOfReadingReactiveToAll.value',
			core.numOfReadingReactiveToAll.value,
			core.collections.books.size,
			core.collections.books.getGroup('READING')?.size,
			core.collections.books.getGroup('all')?.size,
			core.collections.books.getGroup('all').value
		)

		expect(core.numOfReadingReactiveToAll.value).toBe(0)

		instance({ logLevel: undefined })
	})
})
