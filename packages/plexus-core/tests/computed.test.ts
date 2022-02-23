import { computed, PlexusComputedStateInstance, PlexusStateInstance, state } from "../src"
// import { PlexusState, PlexusStateInstance } from '../src/interfaces';
let booleanState: PlexusStateInstance<boolean>,
	stringState: PlexusStateInstance<string>,
	objectState: PlexusStateInstance<Partial<{ a: { a?: boolean; b?: boolean }; b: boolean; c: { b?: boolean } }>>,
	arrayState: PlexusStateInstance<{ item?: string; item2?: { subitem?: string } }[]>,
	nullState: PlexusStateInstance<null | boolean>,
	computedState: PlexusComputedStateInstance<boolean>

const initialValue = {
	boolean: false,
	string: "Hello Plexus!",
	object: { a: { a: true, b: true }, b: true },
	array: [
		{ item: "Hello", item2: { subitem: "World" } },
		{ item: "Goodbye", item2: { subitem: "People" } },
	],
	null: null,
}

beforeEach(() => {
	booleanState = state(initialValue.boolean)
	stringState = state(initialValue.string)
	objectState = state<{ a?: { a?: boolean; b?: boolean }; b?: boolean; c?: { b?: boolean } }>(initialValue.object)
	arrayState = state<{ item?: string; item2?: { subitem?: string } }[]>(initialValue.array)
	nullState = state(initialValue.null)
	computedState = computed(
		(value) => {
			console.log(`current computed value: ${value}`)
			booleanState.set(!!stringState.value)
			console.log(`computed to: ${booleanState.value}`)
			return booleanState.value
		},
		[stringState]
	)
})
describe("Testing Computed State Function", () => {
	test("Can initialize a computed state value", () => {
		// booleanState.set(true)
		// expect(booleanState.value).toBe(true)
		expect(computedState.value).toBe(true)
	})
	test("Can update a computed state value", () => {
		stringState.set("daasw")
		expect(booleanState.value).toBe(true)
		expect(computedState.value).toBe(true)
		stringState.set("")
		expect(booleanState.value).toBe(false)
		expect(computedState.value).toBe(false)
	})
})
