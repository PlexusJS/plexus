"use strict"
import { instance, PlexusStateInstance, state } from "@plexusjs/core"
// import { PlexusState, PlexusStateInstance } from '../src/interfaces';
type ObjectStateExample = Partial<{ a: { a?: boolean; b?: boolean }; b: boolean; c: { b?: boolean } }>
let booleanState: PlexusStateInstance<boolean>,
	stringState: PlexusStateInstance<string>,
	objectState: PlexusStateInstance<ObjectStateExample>,
	arrayState: PlexusStateInstance<{ item?: string; item2?: { subitem?: string } }[]>,
	nullState: PlexusStateInstance<null>

const initialValue = {
	boolean: true,
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
	objectState = state<ObjectStateExample>(initialValue.object)
	arrayState = state<{ item?: string; item2?: { subitem?: string } }[]>(initialValue.array)
	nullState = state(initialValue.null)
})
describe("Testing State Function", () => {
	test("Can save a value", () => {
		const value = state(1)
		expect(value.value).toBe(1)
	})

	test("Change value and remember the old one", () => {
		const value = state(1)
		value.set(2)
		expect(value.value).toBe(2)
		expect(value.lastValue).toBe(1)
	})

	test("Checking state().set()", () => {
		// check .set(value: object)
		objectState.set({ a: { b: false } })
		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a?.b).toBe(false)
	})

	test("Checking state().patch()", () => {
		// can the object deep merge?
		objectState.patch({ a: { b: false } })
		expect(objectState.value.a?.a).toBe(true)
		// check that other value is still there
		expect(objectState.value.b).toBe(true)
		// changed intended value
		expect(objectState.value.a?.b).toBe(false)

		// console.log(arrayState.value)
		// check array deep merge
		arrayState.patch([{ item: "Hello2" }])
		// console.log(arrayState.value)
		expect(arrayState.value[0].item).toBe("Hello2")
		expect(arrayState.value[0].item2).toStrictEqual({ subitem: "World" })
		expect(arrayState.value[1].item).toBe("Goodbye")
	})

	test("Checking state.watch()", () => {
		let callbackCalled = false

		// can add watcher
		const watcherDestroyer = stringState.watch((value) => {
			console.log("callback called", value)
			callbackCalled = true
		})
		console.log(instance().runtime.engine.events.entries())
		stringState.set("Hello World")
		expect(callbackCalled).toBe(true)
		// can remove watcher
		// stringState.removeWatcher(watcherKey);
		watcherDestroyer()
		// console.log(watcherDestroyer.toString(), instance().runtime.engine.events.entries())
		stringState.set("new value")
		expect(callbackCalled).toBe(true)
	})

	test("Checking state nextValue", () => {
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
})
