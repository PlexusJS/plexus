import { collection, PlexusComputedStateInstance, PlexusStateInstance, state } from "@plexusjs/core"
import React, { useEffect } from "react"
import { usePlexus } from "../packages/plexus-react/src"
import * as renderer from "react-test-renderer"

let myState = state("yes")
let myState2: PlexusStateInstance<number>
let myState3: PlexusStateInstance<Partial<{ name: string }>>
let myState4: PlexusComputedStateInstance<number>

const myCollection = collection<{ id: string; a: number }>().createGroup("test").createSelector("main")
beforeEach(() => {
	myState2 = state(1)
	myState3 = state<Partial<{ name: string }>>({ name: "test" })
	myCollection.collect({ id: "poggers", a: 2 }, "test")
})
afterEach(() => {
	myCollection.clear()
})

describe("Test react integration", () => {
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
		const tree = renderer.create(<RandomComponent />).toJSON()
		expect(tree).toMatchSnapshot()
		// myState.set("no")
	})
	test("usePlexus hook w/collection group", () => {
		function RandomComponent() {
			myCollection.collect({ id: "pog", a: 1 }, "test")
			const g1 = usePlexus(myCollection.getGroup("test"))
			const [groupValue, stateItem] = usePlexus([myCollection.getGroup("test"), myState2])
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p>{JSON.stringify(groupValue)}</p>
				</div>
			)
		}
		const tree = renderer.create(<RandomComponent />).toJSON()
		expect(tree).toMatchSnapshot()
	})
	// TODO: usePlexus hook w/computed state
	// test("usePlexus hook w/collection selector", () => {
	// 	function RandomComponent() {
	// 		myCollection.collect({ id: "pog", a: 1 }, "test")

	// 		const g1 = usePlexus(myCollection.getSelector("main"))
	// 		const [groupValue, stateItem] = usePlexus([myCollection.getSelector("main"), myState2])
	// 		// const [groupValue] = usePlexus([myCollection.groups.test])
	// 		return (
	// 			<div>
	// 				<p>{JSON.stringify(groupValue)}</p>
	// 			</div>
	// 		)
	// 	}
	// 	const tree = renderer.create(<RandomComponent />).toJSON()
	// 	expect(tree).toMatchSnapshot()
	// })
	test("usePlexus hook with selector", () => {
		function RandomComponent() {
			const s1 = usePlexus(myCollection.getSelector("main"))
			useEffect(() => {
				console.log("yay!")
				myCollection.collect({ id: "pog", a: 1 }, "test")
				myCollection.getSelector("main").select("pog")
				setTimeout(() => {}, 3000)
			}, [])
			useEffect(() => {
				console.log(s1)
			}, [s1])

			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p>{JSON.stringify(s1)}</p>
				</div>
			)
		}
		const tree = renderer.create(<RandomComponent />).toJSON()
		expect(tree).toMatchSnapshot()
	})
	test("usePlexus hook with group", () => {
		function RandomComponent() {
			myCollection.collect({ id: "pog", a: 1 }, "test")
			const g1 = usePlexus(myCollection.getGroup("test"))
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p>{JSON.stringify(g1)}</p>
				</div>
			)
		}
		const tree = renderer.create(<RandomComponent />).toJSON()
		expect(tree).toMatchSnapshot()
	})
})
