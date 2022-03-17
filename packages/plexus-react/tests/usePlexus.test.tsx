import * as React from "react"
// import { usePlexus } from "../dist"
import { usePlexus } from "../src"
import * as renderer from "react-test-renderer"
import { collection, PlexusComputedStateInstance, PlexusStateInstance, state } from "@plexusjs/core"

let myState: PlexusStateInstance<string>
let myState2: PlexusStateInstance<number>
let myState3: PlexusComputedStateInstance<number>

const myCollection = collection<{ id: string; a: number }>().createGroup("test").createSelector("main")
beforeEach(() => {
	myState = state("yes")
	myState2 = state(1)
	myCollection.collect({ id: "poggers", a: 2 }, "test")
})

describe("Test react integration", () => {
	test("usePlexus hook w/state", () => {
		function RandomComponent() {
			const stateValue = usePlexus(myState)
			const [stateValue1, stateValue2] = usePlexus([myState, myState2])

			return (
				<div>
					<p>{stateValue}</p>
					<p>{stateValue1}</p>
					<p>{stateValue2}</p>
				</div>
			)
		}
		const tree = renderer.create(<RandomComponent />).toJSON()
		myState.set("no")
		expect(tree)
		expect(tree).toMatchSnapshot()
	})
	test("usePlexus hook w/collection group", () => {
		function RandomComponent() {
			myCollection.collect({ id: "pog", a: 1 }, "test")
			const g1 = usePlexus(myCollection.getGroup("test"))
			const [groupValue, stateItem] = usePlexus([myState, myState2])
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
})
