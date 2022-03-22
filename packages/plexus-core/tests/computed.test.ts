import { computed, PlexusComputedStateInstance, PlexusStateInstance, state } from "../src"
// import { PlexusState, PlexusStateInstance } from '../src/interfaces';
let booleanState: PlexusStateInstance<boolean>,
	stringState: PlexusStateInstance<string>,
	numberState: PlexusStateInstance<number>,
	objectState: PlexusStateInstance<Partial<{ a: { a?: boolean; b?: boolean }; b: boolean; c: { b?: boolean } }>>,
	arrayState: PlexusStateInstance<{ item?: string; item2?: { subitem?: string } }[]>,
	nullState: PlexusStateInstance<null | boolean>,
	computedState: PlexusComputedStateInstance<number>

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
	booleanState = state(initialValue.boolean)
	stringState = state(initialValue.string)
	objectState = state<{ a?: { a?: boolean; b?: boolean }; b?: boolean; c?: { b?: boolean } }>(initialValue.object)
	arrayState = state<{ item?: string; item2?: { subitem?: string } }[]>(initialValue.array)
	nullState = state(initialValue.null)
	numberState = state(initialValue.number)
	computedState = computed(() => {
		console.log(`Looking at ${stringState.value}`)
		numberState.set(stringState.value.length)
		console.log(`computed to: ${booleanState.value}`)
		return stringState.value.length
	}, [stringState])
})
describe("Testing Computed State Function", () => {
	test("Can initialize a computed state value", () => {
		// booleanState.set(true)
		// expect(booleanState.value).toBe(true)
		expect(computedState.value).toBe(13)
	})
	test("Can update a computed state value", () => {
		console.log(`Looking at ${stringState.value}`)
		stringState.set("daasw")
		expect(stringState.value).toBe("daasw")

		expect(computedState.value).toBe(5)
		stringState.set("")
		expect(numberState.value).toBe(0)
		expect(computedState.value).toBe(0)
	})
})
