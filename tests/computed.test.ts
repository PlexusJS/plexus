import { beforeEach, afterEach, describe, test, expect } from "vitest"

import { collection, computed, instance, PlexusComputedStateInstance, PlexusStateInstance, state } from "@plexusjs/core"
// import { PlexusState, PlexusStateInstance } from '../src/interfaces';

// instance({ logLevel: "debug" })
const states = {
	stringState: state<string>("Hello Plexus!"),
	numberState: state(-1),
}
const collections = {
	books: collection<{
		name: string
		pages: number
		sku: string
	}>({ primaryKey: "sku" }).createSelector("READING"),
}
const core = {
	state: states,
	collections: collections,
	computedState: computed(() => {
		// console.log(`Looking at ${stringState.value}`)
		states.numberState.set(states.stringState.value.length)
		// console.log(`computed to: ${booleanState.value}`)
		return states.stringState.value.length
	}, [states.stringState, collections.books.selectors.READING]),
	readingBookComputation: computed(() => {
		return collections.books.selectors.READING.value.pages
	}, [collections.books.selectors.READING]),
}

const initialValue = {
	boolean: false,
	string: "Hello Plexus!",
	object: { a: { a: true, b: true }, b: true },
	array: [
		{ item: "Hello", item2: { subitem: "World" } },
		{ item: "Goodbye", item2: { subitem: "People" } },
	],
	null: null,

	number: 1,
}

beforeEach(() => {
	core.state.stringState.set("Hello Plexus! (initialized)")
	core.state.numberState.set(1)
})
afterEach(() => {
	core.state.stringState.reset()
	core.state.numberState.reset()
})

describe("Testing Computed State Function", () => {
	test("Can INITIALIZE a computed state value", () => {
		expect(core.computedState.value).toBe("Hello Plexus! (initialized)".length)
	})
	test("Can UPDATE a computed state value", () => {
		console.log(`Looking at stringState ${core.state.stringState.value}`)
		core.state.stringState.set("daasw")
		expect(core.state.stringState.value).toBe("daasw")

		expect(core.computedState.value).toBe(5)
		core.state.stringState.set("")
		expect(core.state.numberState.value).toBe(0)
		expect(core.computedState.value).toBe(0)
	})
	test("Can WATCH a computed state value", () => {
		// console.log(`Looking at ${stringState.value}`)
		core.computedState.watch((v) => {
			console.log("computedState.value changed to: ", v)
		})
		core.state.stringState.set("daasw")

		expect(core.state.stringState.value).toBe("daasw")

		expect(core.computedState.value).toBe(5)
		core.state.stringState.set("")
		expect(core.state.numberState.value).toBe(0)
		expect(core.computedState.value).toBe(0)
	})

	test("Computed can watch a collection selector", () => {
		core.collections.books.collect({
			name: "James Bond",
			pages: 12,
			sku: "t6sawo4bjhkv47839d3",
		})

		core.collections.books.selectors.READING.select("t6sawo4bjhkv47839d3")

		core.readingBookComputation.watch((v) => {
			console.log("readingBookComputation.value changed to: ", v)
		})

		expect(core.readingBookComputation.value).toBe(12)
	})
})
