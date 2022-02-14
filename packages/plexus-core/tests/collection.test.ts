import { collection, PlexusCollectionInstance } from "../src"

let myCollection = collection<{ thing: string; id: number }>().createGroups(["group1"]).createSelectors(["main"])

beforeEach(() => {
	myCollection.clear()
})
describe("Testing Collection", () => {
	test("Can create collection", () => {
		// can properly collect data
		myCollection.collect({ thing: "lol", id: 0 })
		myCollection.collect([
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])
		expect(myCollection.value[0].thing).toBe("lol")
		expect(myCollection.value[1].thing).toBe("lol3")
		expect(myCollection.value[2].thing).toBe("lols")

		// can properly retrieve data values
		expect(myCollection.getItemValue(0).thing).toBe("lol")
		expect(myCollection.getItemValue(2).thing).toBe("lol3")
		expect(myCollection.getItemValue(1).thing).toBe("lols")
	})
	test("Do Groups Work?", () => {
		expect(myCollection.value.length).toBe(0)
		// can properly collect objects with the same keys
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])

		expect(myCollection.value.length).toBe(3)
		expect(myCollection.value[0].thing).toBe("lol")
		expect(myCollection.value[1].thing).toBe("lol3")
		expect(myCollection.value[2].thing).toBe("lols")

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: "lol", id: 5 }, "group1")
		expect(myCollection.getGroupsOf(5)).toBeDefined()
		// console.log(myCollection.getGroupsOf(5))
		// console.log(myCollection.getGroup('group1').index)
		// console.log(myCollection.groups.group1.index)

		expect(myCollection.groups.group1.index.size).toBe(1)
		expect(myCollection.groups.group1.value[0].id).toBe(5)

		// if we try to change the key of an item, it should do nothing and fail silently
		myCollection.groups.group1.data[0].set({ thing: "lol", id: 0 })
		expect(myCollection.groups.group1.value[0].id).toBe(5)
		// console.log(myCollection.getGroup('group1').value)

		// we should be able to update a data item and see it in all places we can get the item (in the collection, in the groups, etc)
		myCollection.update(5, { thing: "idk" })
		// console.log(myCollection.getGroup('group1').value)
		expect(myCollection.getItemValue(5).thing).toBe("idk")
		expect(myCollection.getGroup("group1")).toBeDefined()
		expect(myCollection.getGroup("group1").value[0].thing).toBe("idk")
	})

	test("Do Selectors Work?", () => {
		expect(myCollection.value.length).toBe(0)
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])
		myCollection.getSelector("main").select(0)
		console.log(myCollection.getSelector("main").key)
		expect(myCollection.selectors.main.key).toBe(0)
		expect(myCollection.getSelector("main").value.id).toBe(0)
		expect(myCollection.getSelector("main").value.thing).toBe("lol")
	})
	test("Watching Groups", () => {
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])

		expect(myCollection.value.length).toBe(3)
		expect(myCollection.value[0].thing).toBe("lol")
		expect(myCollection.value[1].thing).toBe("lol3")
		expect(myCollection.value[2].thing).toBe("lols")

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: "lol", id: 5 }, "group1")
		expect(myCollection.getGroupsOf(5)).toBeDefined()

		// watch for any change on group1
		myCollection.watchGroup("group1", (group) => {
			console.log("group1 changed")
			expect(group[0].thing).toBeDefined()
		})
		myCollection.update(5, { thing: "lol2", id: 5 })
	})
})
