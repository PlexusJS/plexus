import { beforeEach, afterEach, describe, test, expect } from "vitest"

import {
	collection,
	computed,
	instance,
	PlexusComputedStateInstance,
	PlexusStateInstance,
	PlexusEventInstance,
	state,
	event,
} from "../packages/plexus-core"
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
const myState = state<string>("yes")
const myState2 = state(1)
const myState3 = state<Partial<{ name: string }>>({ name: "test" })
const myState4 = computed(() => {
	return myState2.value + 12
}, [myState])

const myCollection = collection<{ id: string; a: number }>().createGroup("test").createSelector("main")
beforeEach(() => {
	myCollection.collect({ id: "poggers", a: 2 }, ["test"])
})
afterEach(() => {
	myState2.reset()
	myState.reset()
	myState3.reset()
	myState4.reset()

	myCollection.clear()
})

describe("Test react integration (usePlexus)", () => {
	test("usePlexus hook w/state", () => {
		instance({ logLevel: "debug" })
		function RandomComponent() {
			const stateValue = usePlexus(myState)
			// const [stateValue4, stateValue2] = usePlexus([myState4, myState2])
			// const stateValue3 = usePlexus(myState3)

			return (
				<div>
					<p id="string-state">{stateValue}</p>
					{/* <p>{stateValue4}</p> */}
					{/* <p>{stateValue2}</p> */}
					{/* <strong>{stateValue3.name}</strong> */}
				</div>
			)
		}

		const component = renderer.create(<RandomComponent />)
		let tree = toJson(component)
		renderer.act(() => {
			myState.set("no")
			console.log('setting state to "no"', myState.value)
			myState2.set(2)
			console.log("setting state2 to 2")
			instance({ logLevel: "silent" })
			tree = toJson(component)

			expect(component.root.findByProps({ id: "string-state" }).props.children).toBe("no")
		})
	})
	test("usePlexus hook w/collection group", () => {
		// instance({ logLevel: "debug" })
		function RandomComponent() {
			useEffect(() => {
				myCollection.collect({ id: "pog", a: 1 }, "test")
			}, [])
			const [groupValue, stateItem] = usePlexus([myCollection.getGroup("test"), myState2])
			const stateValue = usePlexus(myState)
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">{JSON.stringify(groupValue)}</p>
					<p id="string-state">{stateValue}</p>
				</div>
			)
		}
		const component = renderer.create(<RandomComponent />)
		let tree = toJson(component)
		renderer.act(() => {
			myState.set("no")
			tree = toJson(component)
			expect(tree).toMatchSnapshot()
			expect(component.root.findByProps({ id: "string-state" }).props.children).toBe("no")
		})
	})
	test("usePlexus hook with selector", () => {
		// instance({
		// 	logLevel: "debug",
		// })
		function RandomComponent() {
			myCollection.collect({ id: "pog", a: 1 }, "test")
			myCollection.getSelector("main").select("pog")
			const [s1] = usePlexus([myCollection.getSelector("main")])

			useEffect(() => {
				// console.log(s1)
			}, [s1])

			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">
						{s1.a} as {s1.id}
					</p>
				</div>
			)
		}
		const component = renderer.create(<RandomComponent />)
		let tree = toJson(component)
		renderer.act(() => {
			// tree = renderer.create(<RandomComponent />)
		})
		expect(tree).toMatchSnapshot()
		expect(myCollection.getSelector("main").value).toEqual({ id: "pog", a: 1 })
		expect(component.root.findByProps({ id: "data" }).children).toEqual(["1", " as ", "pog"])
	})
	// test("usePlexus: Check react reload", () => {
	// 	instance({
	// 		logLevel: "debug",
	// 	})
	// 	function RandomComponent() {
	// 		myCollection.collect({ id: "pog", a: 1 }, "test")
	// 		myCollection.getSelector("main").select("pog")
	// 		const s1 = usePlexus(myCollection.getSelector("main"))

	// 		const [temp, setTemp] = useState(0)

	// 		useEffect(() => {
	// 			console.log(s1)

	// 		}, [s1])

	// 		// const [groupValue] = usePlexus([myCollection.groups.test])
	// 		return (
	// 			<div>
	// 				<p id="data">
	// 					{s1.a} as {s1.id}
	// 				</p>
	// 			</div>
	// 		)
	// 	}
	// 	let tree
	// 	renderer.act(() => {
	// 		tree = renderer.create(<RandomComponent />)
	// 	})
	// 	expect(tree.toJSON()).toMatchSnapshot()
	// 	expect(myCollection.getSelector("main").value).toEqual({ id: "pog", a: 1 })
	// 	expect(tree.root.findByProps({ id: "data" }).children).toEqual(["1", " as ", "pog"])
	// })
	test("usePlexus hook with group", () => {
		// instance({
		// 	logLevel: "debug",
		// })
		function RandomComponent() {
			useEffect(() => {}, [])
			// const g1 = usePlexus(myCollection.getGroup("test"))
			const [g1] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">{JSON.stringify(g1)}</p>
				</div>
			)
		}
		let tree: any
		renderer.act(() => {
			tree = renderer.create(<RandomComponent />)
			// console.log("collecting a new item")
			myCollection.collect({ id: "pog", a: 1 }, "test")
			// console.log(`collected item`, { id: "pog", a: 1 })
		})
		expect(tree.toJSON()).toMatchSnapshot()

		expect(myCollection.getGroup("test").value).toEqual([
			{ id: "poggers", a: 2 },
			{ id: "pog", a: 1 },
		])
		expect(tree.root.findByProps({ id: "data" }).children).toEqual([
			JSON.stringify([
				{ id: "poggers", a: 2 },
				{ id: "pog", a: 1 },
			]),
		])
	})

	test("usePlexus hook with computed", () => {
		function RandomComponent() {
			const computedThing = usePlexus(myState4)
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">{computedThing}</p>
				</div>
			)
		}
		let tree: any
		renderer.act(() => {
			tree = renderer.create(<RandomComponent />).toJSON()
		})

		expect(tree).toMatchSnapshot()
	})
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
		let tree: any
		renderer.act(() => {
			tree = renderer.create(<RandomComponent />)
		})
		expect(tree.toJSON()).toMatchSnapshot()
		// expect().toEqual()
		expect(tree.root.findByProps({ id: "data" }).children).toEqual(["test"])
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
