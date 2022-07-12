import { beforeEach, afterEach, describe, test, expect } from "vitest"

import { computed, PlexusComputedStateInstance, PlexusStateInstance, state } from "@plexusjs/core/src"
// import { PlexusState, PlexusStateInstance } from '../src/interfaces';

const stringState = state<string>("Hello Plexus!")
const numberState = state(-1)
const computedState = computed(() => {
	// console.log(`Looking at ${stringState.value}`)
	numberState.set(stringState.value.length)
	// console.log(`computed to: ${booleanState.value}`)
	return stringState.value.length
}, [stringState])
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
	stringState.set("Hello Plexus! (initialized)")
	numberState.set(1)
})
afterEach(() => {
	stringState.reset()
	numberState.reset()
})

describe("Testing Computed State Function", () => {
	test("Can INITIALIZE a computed state value", () => {
		expect(computedState.value).toBe("Hello Plexus! (initialized)".length)
	})
	test("Can UPDATE a computed state value", () => {
		// console.log(`Looking at ${stringState.value}`)
		stringState.set("daasw")
		expect(stringState.value).toBe("daasw")

		expect(computedState.value).toBe(5)
		stringState.set("")
		expect(numberState.value).toBe(0)
		expect(computedState.value).toBe(0)
	})
	test("Can WATCH a computed state value", () => {
		// console.log(`Looking at ${stringState.value}`)
		computedState.watch((v) => {
			console.log("computedState.value changed to: ", v)
		})
		stringState.set("daasw")

		expect(stringState.value).toBe("daasw")

		expect(computedState.value).toBe(5)
		stringState.set("")
		expect(numberState.value).toBe(0)
		expect(computedState.value).toBe(0)
	})
})
