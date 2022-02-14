import * as React from "react"
import { usePlexus } from "../dist"
import * as renderer from "react-test-renderer"
import { collection, PlexusStateInstance, state } from "@plexusjs/core"

let myState: PlexusStateInstance
const myCollection = collection<{ id: string; a: number }>().createGroup("test")
beforeEach(() => {
	myState = state("yes")
	myCollection.collect({ id: "poggers", a: 2 }, "test")
})

describe("Test react integration", () => {
	test("usePlexus hook w/state", () => {
		function RandomComponent() {
			const stateValue = usePlexus(myState)
			const g1 = usePlexus(myCollection.getGroup("test"))

			return (
				<div>
					<p>{stateValue}</p>
				</div>
			)
		}
		const tree = renderer.create(<RandomComponent />).toJSON()
		expect(tree).toMatchSnapshot()
	})
	test("usePlexus hook w/collection group", () => {
		function RandomComponent() {
			myCollection.collect({ id: "pog", a: 1 }, "test")
			const [groupValue] = usePlexus([myCollection.getGroup("test")])
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
