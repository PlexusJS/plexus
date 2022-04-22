import { collection, PlexusComputedStateInstance, PlexusStateInstance, state } from "@plexusjs/core"
import * as React from "react"
import { usePlexus } from "../packages/plexus-react/dist"
import * as renderer from "react-test-renderer"

let myState: PlexusStateInstance<string>
let myState2: PlexusStateInstance<number>
let myState3: PlexusStateInstance<Partial<{ name: string }>>
let myState4: PlexusComputedStateInstance<number>

const myCollection = collection<{ id: string; a: number }>().createGroup("test").createSelector("main")
beforeEach(() => {
	myState = state("yes")
	myState2 = state(1)
	myState3 = state({ name: "test" })
	myCollection.collect({ id: "poggers", a: 2 }, "test")
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
})
