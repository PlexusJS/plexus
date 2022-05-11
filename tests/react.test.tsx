import { collection, computed, instance, PlexusComputedStateInstance, PlexusStateInstance, PlexusEventInstance, state, event } from "@plexusjs/core"
import React, { useEffect, useState } from "react"
import { useEvent, usePlexus } from "../packages/plexus-react/src"
import * as renderer from "react-test-renderer"

type Payload = {
	name: string
	status: string
}
let myState = state("yes")
let myState2: PlexusStateInstance<number>
let myState3: PlexusStateInstance<Partial<{ name: string }>>
let myState4: PlexusComputedStateInstance<number>
let myEvents: PlexusEventInstance<Payload>

const myCollection = collection<{ id: string; a: number }>().createGroup("test").createSelector("main")
beforeEach(() => {
	myEvents = event<Payload>()
	myState2 = state(1)
	myState3 = state<Partial<{ name: string }>>({ name: "test" })
	myCollection.collect({ id: "poggers", a: 2 }, ["test"])
	myState4 = computed(() => {
		return myState2.value + 12
	}, [myState])
})
afterEach(() => {
	myCollection.clear()
})

describe("Test react integration (usePlexus)", () => {
	test("usePlexus hook w/state", () => {
		function RandomComponent() {
			const stateValue = usePlexus(myState)
			const [stateValue1, stateValue2] = usePlexus([myState, myState2])
			const [stateValue3] = usePlexus([myState3])

			return (
				<div>
					<p>{stateValue}</p>
					<p>{stateValue1}</p>
					<p>{stateValue2}</p>
					<strong>{stateValue3.name}</strong>
				</div>
			)
		}
		let tree: any
		renderer.act(() => {
			tree = renderer.create(<RandomComponent />).toJSON()
		})
		expect(tree).toMatchSnapshot()
		// myState.set("no")
	})
	test("usePlexus hook w/collection group", () => {
		instance({ logLevel: "debug" })
		function RandomComponent() {
			useEffect(() => {
				myCollection.collect({ id: "pog", a: 1 }, "test")
			}, [])
			const [groupValue, stateItem] = usePlexus([myCollection.getGroup("test"), myState2])
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id="data">{JSON.stringify(groupValue)}</p>
				</div>
			)
		}
		let tree: any
		renderer.act(() => {
			tree = renderer.create(<RandomComponent />).toJSON()
		})
		expect(tree).toMatchSnapshot()
	})
	test("usePlexus hook with selector", () => {
		instance({
			logLevel: "debug",
		})
		function RandomComponent() {
			myCollection.collect({ id: "pog", a: 1 }, "test")
			myCollection.getSelector("main").select("pog")
			const s1 = usePlexus(myCollection.getSelector("main"))

			useEffect(() => {
				console.log(s1)
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
		let tree
		renderer.act(() => {
			tree = renderer.create(<RandomComponent />)
		})
		expect(tree.toJSON()).toMatchSnapshot()
		expect(myCollection.getSelector("main").value).toEqual({ id: "pog", a: 1 })
		expect(tree.root.findByProps({ id: "data" }).children).toEqual(["1", " as ", "pog"])
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
		instance({
			logLevel: "debug",
		})
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
			console.log("collecting a new item")
			myCollection.collect({ id: "pog", a: 1 }, "test")
			console.log(`collected item`, { id: "pog", a: 1 })
		})
		expect(tree.toJSON()).toMatchSnapshot()

		expect(myCollection.getGroup("test").value).toEqual([
			{ id: "poggers", a: 2 },
			{ id: "pog", a: 1 },
		])
		// expect(tree.root.findByProps({ id: "data" }).children).toEqual([
		// 	JSON.stringify([
		// 		{ id: "poggers", a: 2 },
		// 		{ id: "pog", a: 1 },
		// 	]),
		// ])
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
			const computedThing = useEvent(myEvents, (payload) => {
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
