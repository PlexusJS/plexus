import { api, PlexusApi, PlexusAction, event, state } from "../src"
// import { instance } from '../src/instance';
// import { PlexusEvent, PxState, PxStateInstance } from '../src/interfaces';

describe("Testing Event Function", () => {
	test("Emitting a string", async () => {
		const myEvent = event<string>()
		// const value = state(1)
		const destroy = myEvent.on((value) => {
			expect(value).toBeDefined()
			expect(value).toBe("test")
		})

		myEvent.emit("test")
		// console.log(myApi.config)
		destroy()
	})
	test("Emitting a number", async () => {
		const myEvent = event<number>()
		const _value = state(1)
		const destroy = myEvent.on((value) => {
			expect(value).toBe(4)
			_value.set(value)
		})

		myEvent.emit(4)

		await new Promise<void>((ret, rej) => {
			setTimeout(() => {
				ret()
				expect(_value.value).toBe(4)
				destroy()
				
			}, 100)
		})

		// console.log(myApi.config)
	})
})
