import { collection, PlexusCollectionInstance } from "@plexusjs/core/src"

let myCollection = collection<{ thing: string; id: number }>().createGroups(["group1", "group2"]).createSelector("main")

beforeEach(() => {
	myCollection.clear()
})
describe("Testing Collection", () => {
	test("Can create collection", () => {
		expect(myCollection.value.length).toBe(0)
		// can properly collect data
		myCollection.collect({ thing: "lol", id: 0 })
		expect(myCollection.value.length).toBe(1)
		// myCollection.getSelector("")
		// myCollection.getGroup("group1")
		myCollection.collect([
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])
		expect(myCollection.value[0].thing).toBe("lol")
		expect(myCollection.value[1].thing).toBe("lol3")
		expect(myCollection.value[2].thing).toBe("lols")

		// can properly retrieve data values
		expect(myCollection.getItemValue(0)?.thing).toBe("lol")
		expect(myCollection.getItemValue(2)?.thing).toBe("lol3")
		expect(myCollection.getItemValue(1)?.thing).toBe("lols")
	})
	test("Does it pass the vibe check ?", () => {
		myCollection.collect({ thing: "xqcL", id: 0 })
		expect(myCollection.getItem(0).value?.thing).toBe("xqcL")
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
		console.log(myCollection.value)
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
		console.log(myCollection.groups, myCollection.groups.group1.value)

		// if we try to change the key of an item, it should do nothing and fail silently
		myCollection.groups.group1.data[0]?.set({ thing: "lol", id: 0 })
		expect(myCollection.groups.group1.value[0].id).toBeDefined()
		// console.log(myCollection.getGroup('group1').value)

		// we should be able to update a data item and see it in all places we can get the item (in the collection, in the groups, etc)
		myCollection.update(5, { thing: "idk" })
		// console.log(myCollection.getGroup('group1').value)
		expect(myCollection.getItemValue(5).thing).toBe("idk")
		expect(myCollection.getGroup("group1")).toBeDefined()
		expect(myCollection.getGroup("group1").value[0].thing).toBe("idk")

		// we should be able to have two groups that return different values :)
		myCollection.collect({ thing: "hehe", id: 78 }, "yes")
		expect(myCollection.getGroup("yes").value[0].thing).toBe("hehe")
		myCollection.collect({ thing: "hoho", id: 96 }, "no")
		expect(myCollection.getGroup("no").value[0]?.thing).toBe("hoho")
	})

	test("Do Selectors Work?", () => {
		expect(myCollection.value.length).toBe(0)
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])
		myCollection.getSelector("main").select(0)
		// console.log(myCollection.getSelector("main").key)

		const del = myCollection.getSelector("main").watch((v) => {
			console.log(v)
			expect(v.thing).toBe("haha")
		})
		expect(myCollection.getSelector("main").value?.thing).toBe("lol")
		myCollection.update(0, { thing: "haha" })
		del()
		expect(myCollection.selectors.main.key).toBe(0)
		expect(myCollection.getSelector("main").value?.id).toBe(0)
		expect(myCollection.getSelector("main").value?.thing).toBe("haha")
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

		expect(myCollection.getGroupsOf(5)).toEqual(["group1"])

		// watch for any change on group1
		myCollection.watchGroup("group1", (group) => {
			console.log("group1 changed\n%o\n%o", group, myCollection.groups.group1.index)
			expect(group[0].thing).toBeDefined()
		})
		myCollection.update(5, { thing: "lol2", id: 5 })
	})
})
