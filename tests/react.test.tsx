import { beforeEach, afterEach, describe, test, expect } from "vitest"
import { screen, waitFor, within } from "@testing-library/react"
import { render } from "./test-utils"
import { collection, computed, instance, state, event } from "../packages/plexus-core"
import React, { useEffect, useState } from "react"
import { useDeposit, useEvent, usePlexus } from "../packages/plexus-react/src"
import * as renderer from "react-test-renderer"

function toJson(component: renderer.ReactTestRenderer) {
	const result = component.toJSON()
	expect(result).toBeDefined()
	expect(result).not.toBeInstanceOf(Array)
	return result as renderer.ReactTestRendererJSON
}

type Payload = {
	name: string
	status: string
}

const myEvents = event<Payload>()
const stringState = state<string>("yes")
const numberState = state(1)
const objectState = state<Partial<{ name: string }>>({ name: "test" })
instance({ logLevel: "debug" })
const computedState = computed(() => {
	console.log("RUNNING THE COMP StATE VALUE")
	return numberState.value * 2
}, [numberState])
instance({ logLevel: "silent" })
const myCollection = collection<{ id: string; a: number }>().createGroup("test").createSelector("MAIN")

beforeEach(() => {
	myCollection.collect({ id: "poggers", a: 2 }, ["test"])
})

afterEach(() => {
	numberState.reset()
	stringState.reset()
	objectState.reset()
	computedState.reset()

	myCollection.clear()
})
function RandomComponent() {
	const str = usePlexus(stringState)
	const [compu, num] = usePlexus([computedState, numberState])
	const [groupValue, stateItem] = usePlexus([myCollection.getGroup("test"), numberState])
	const obj = usePlexus(objectState)
	const [groupTest] = usePlexus([myCollection.groups.test])
	const [MAIN] = usePlexus([myCollection.getSelector("MAIN")])
	useEffect(() => {
		myCollection.collect({ id: "pog", a: 1 }, "test")
	}, [])
	return (
		<div>
			<p data-testid="str">{str}</p>
			<p data-testid="compu">{compu}</p>
			<p data-testid="num">{num}</p>
			<strong data-testid="obj-property">{obj.name}</strong>
			<p data-testid="group-test">{JSON.stringify(groupTest)}</p>
			<p data-testid="selector-string">{JSON.stringify(MAIN)}</p>
		</div>
	)
}
describe("Test react integration (usePlexus)", () => {
	test("usePlexus hook w/ Watchables", async () => {
		// console.log(Array.from(instance()._states).map((v) => v.id))
		render(<RandomComponent />)
		await renderer.act(async () => {
			await waitFor(() => screen.getByTestId("str"))
		})
		expect(screen.getByTestId("str").innerHTML).toBe("yes")
		expect(screen.getByTestId("group-test").innerHTML).toBe(`[{"id":"poggers","a":2},{"id":"pog","a":1}]`)
		await renderer.act(async () => {
			myCollection.collect({ id: "pog", a: 2 }, "test")
			myCollection.collect({ id: "3", a: 2 }, "test")
			await waitFor(() => screen.getByTestId("group-test"))
		})
		expect(screen.getByTestId("group-test").innerHTML).toBe(`[{"id":"poggers","a":2},{"id":"pog","a":2},{"id":"3","a":2}]`)

		// instance({ logLevel: "debug" })
		instance({ logLevel: "debug", instanceId: "react" })
		await renderer.act(async () => {
			// test computed render
			numberState.set(4)
			await waitFor(() => screen.getByTestId("compu"))
		})
		expect(screen.getByTestId("compu").innerHTML).toBe("8")
		await renderer.act(async () => {
			stringState.set("no")
			await waitFor(() => screen.getByTestId("str"))
		})
		instance({ logLevel: "silent", instanceId: "react" })
		expect(screen.getByTestId("str").innerHTML).toBe("no")
		// const component = render(<RandomComponent />)
		// // render
		// let tree = toJson(component)
		// renderer.act(() => {
		// 	myCollection.collect({ id: "pog", a: 1 }, "test")
		// 	myCollection.getSelector("main").select("pog")
		// 	myState.set("no")
		// 	console.log('setting state to "no"', myState.value)
		// 	myState2.set(2)
		// 	console.log("setting state2 to 2")
		// 	myCollection.collect({ id: "pog", a: 1 }, "test")
		// 	instance({ logLevel: "silent" })
		// 	component.update(<RandomComponent />)
		// })
		// tree = toJson(component)

		// expect(component.root.findByProps({ id: "string-state" }).props.children).toBe("no")
		// expect(myCollection.getGroup("test").value).toEqual([
		// 	{ id: "poggers", a: 2 },
		// 	{ id: "pog", a: 1 },
		// ])
		// expect(component.root.findByProps({ id: "group-string" }).children).toEqual([
		// 	JSON.stringify([
		// 		{ id: "poggers", a: 2 },
		// 		{ id: "pog", a: 1 },
		// 	]),
		// ])
		// console.log("setting state to yes")
		// renderer.act(() => {
		// })
	})
	// test("usePlexus hook w/state", () => {
	// 	instance({ logLevel: "debug" })

	// 	const component = renderer.create(<RandomComponent />)
	// 	let tree = toJson(component)
	// 	renderer.act(() => {
	// 		myState.set("no")
	// 		console.log('setting state to "no"', myState.value)
	// 		myState2.set(2)
	// 		console.log("setting state2 to 2")
	// 	})
	// 	instance({ logLevel: "silent" })
	// 	tree = toJson(component)

	// 	expect(component.root.findByProps({ id: "string-state" }).props.children).toBe("no")
	// })
	// test("usePlexus hook w/collection group", () => {
	// 	// instance({ logLevel: "debug" })
	// 	function RandomComponent() {
	// 		const [groupValue, stateItem] = usePlexus([myCollection.getGroup("test"), myState2])
	// 		const stateValue = usePlexus(myState)
	// 		// const [groupValue] = usePlexus([myCollection.groups.test])
	// 		return (
	// 			<div>
	// 				<p id="data">{JSON.stringify(groupValue)}</p>
	// 				<p id="string-state">{stateValue}</p>
	// 			</div>
	// 		)
	// 	}
	// 	const component = renderer.create(<RandomComponent />)
	// 	let tree = toJson(component)
	// 	renderer.act(() => {
	// 		myState.set("no")
	// 	})
	// 	tree = toJson(component)
	// 	// expect(tree).toMatchSnapshot()
	// 	expect(component.root.findByProps({ id: "string-state" }).props.children).toBe("no")
	// })
	// test("usePlexus hook with selector", () => {
	// 	// instance({
	// 	// 	logLevel: "debug",
	// 	// })
	// 	function RandomComponent() {
	// 		// myCollection.collect({ id: "pog", a: 1 }, "test")
	// 		// myCollection.getSelector("main").select("pog")
	// 		const [s1] = usePlexus([myCollection.getSelector("main")])

	// 		// const [groupValue] = usePlexus([myCollection.groups.test])
	// 		return (
	// 			<div>
	// 				<p id="data">
	// 					{s1.a} as {s1.id}
	// 				</p>
	// 			</div>
	// 		)
	// 	}

	// 	myCollection.collect({ id: "pog", a: 1 }, "test")
	// 	myCollection.getSelector("main").select("pog")
	// 	const component = renderer.create(<RandomComponent />)
	// 	let tree = toJson(component)
	// 	renderer.act(() => {
	// 		// tree = renderer.create(<RandomComponent />)
	// 	})
	// 	expect(tree).toMatchSnapshot()
	// 	expect(myCollection.getSelector("main").value).toEqual({ id: "pog", a: 1 })
	// 	expect(component.root.findByProps({ id: "data" }).children).toEqual(["1", " as ", "pog"])
	// })
	// test("usePlexus hook with group", () => {
	// 	// instance({
	// 	// 	logLevel: "debug",
	// 	// })
	// 	function RandomComponent() {
	// 		const [g1] = usePlexus([myCollection.groups.test])
	// 		return (
	// 			<div>
	// 				<p id="data">{JSON.stringify(g1)}</p>
	// 			</div>
	// 		)
	// 	}
	// 	let tree: any
	// 	renderer.act(() => {
	// 		tree = renderer.create(<RandomComponent />)
	// 		// console.log("collecting a new item")
	// 		myCollection.collect({ id: "pog", a: 1 }, "test")
	// 		// console.log(`collected item`, { id: "pog", a: 1 })
	// 	})
	// 	expect(tree.toJSON()).toMatchSnapshot()

	// 	expect(myCollection.getGroup("test").value).toEqual([
	// 		{ id: "poggers", a: 2 },
	// 		{ id: "pog", a: 1 },
	// 	])
	// 	expect(tree.root.findByProps({ id: "data" }).children).toEqual([
	// 		JSON.stringify([
	// 			{ id: "poggers", a: 2 },
	// 			{ id: "pog", a: 1 },
	// 		]),
	// 	])
	// })
})

describe("Test react integration (useEvent)", () => {
	test("test useEvent", () => {
		function RandomComponent() {
			const [val, setVal] = useState("")
			useEvent(myEvents, (payload) => {
				setVal(payload.name)
			})

			useEffect(() => {
				myEvents.emit({ name: "test", status: "test" })
			}, [])
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">{val}</p>
				</div>
			)
		}
		let component = renderer.create(<RandomComponent />)
		renderer.act(() => {
			component.update(<RandomComponent />)
		})
		let tree = toJson(component)
		renderer.act(() => {
			component.update(<RandomComponent />)
		})
		expect(component.root.findByProps({ id: "data" }).children).toEqual(["test"])
		expect(tree).toMatchSnapshot()
	})
})

describe("Test react integration (useDeposit)", () => {
	test("test useDeposit", () => {
		// lol idk how to test this without user input
		function RandomComponent() {
			const [val, setVal] = useState("")
			const { save, edit } = useDeposit(
				{ name: "string" },
				{
					onSave(payload) {
						setVal(payload.name ?? "")
					},
				}
			)

			useEffect(() => {
				myEvents.emit({ name: "test", status: "test" })
			}, [])
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">{val}</p>
				</div>
			)
		}
		let tree: any
		renderer.act(() => {
			tree = renderer.create(<RandomComponent />)
		})
		expect(tree.toJSON()).toMatchSnapshot()
		// expect().toEqual()
		// expect(tree.root.findByProps({ id: "data" }).children).toEqual(["test"])
	})

	test("testing types of useDeposit", () => {
		function RandomComponent() {
			const [val, setVal] = useState("")
			const { save, edit } = useDeposit<Payload>(
				{ name: "string" },
				{
					onSave(payload) {
						setVal(payload.name ?? "")
					},
				}
			)
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">{val}</p>
				</div>
			)
		}
	})
})
