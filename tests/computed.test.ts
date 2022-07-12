import { beforeEach, afterEach, describe, test, expect } from "vitest"

import { computed, PlexusComputedStateInstance, PlexusStateInstance, state } from "@plexusjs/core/src"
// import { PlexusState, PlexusStateInstance } from '../src/interfaces';
const states = {
	stringState: state<string>("Hello Plexus!"),
	numberState: state(-1),
}
const core = {
	state: states,
	computedState: computed(() => {
		// console.log(`Looking at ${stringState.value}`)
		states.numberState.set(states.stringState.value.length)
		// console.log(`computed to: ${booleanState.value}`)
		return states.stringState.value.length
	}, [states.stringState]),
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
})
