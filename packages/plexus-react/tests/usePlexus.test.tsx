import * as React from "react"
import { usePlexus } from "../dist"
import * as renderer from "react-test-renderer"
import { collection, PlexusStateInstance, state } from "@plexusjs/core"

let myState: PlexusStateInstance
const myCollection = collection<{ text: string }>().createGroup("group1")
beforeEach(() => {
	myState = state("yes")
	myCollection.collect({ text: "hello" }, "group1")
})

describe("Test react integration", () => {
	test("usePlexus hook", () => {
		function RandomComponent() {
			const stateValue = usePlexus(myState)
			const g1 = usePlexus(myCollection.getGroup("group1"))
			
			return (
				<div>
					<p>{stateValue}</p>
				</div>
			)
		}
		const tree = renderer.create(<RandomComponent />).toJSON()
		expect(tree).toMatchSnapshot()
	})
})
