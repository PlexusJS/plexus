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
		// can return the data values as an array
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

		// can properly export data values
		expect(myCollection.value[0].thing).toBe("lol")
		expect(myCollection.value[1].thing).toBe("lol3")
		expect(myCollection.value[2].thing).toBe("lols")

		// can add to groups
		myCollection.collect({ thing: "lol", id: 5 }, "group1")
		expect(myCollection.getGroupsOf(5)).toEqual(["group1"])

		myCollection.collect({ thing: "yay", id: 12 }, ["group1"])
		expect(myCollection.getGroupsOf(12)).toEqual(["group1"])
		// console.log(myCollection.getGroupsOf(5))
		// console.log(myCollection.getGroup('group1').index)
		// console.log(myCollection.groups.group1.index)

		expect(myCollection.groups.group1.index.size).toBe(2)
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
		myCollection.collect(
			[
				{ thing: "lol", id: 0 },
				{ thing: "lol3", id: 2 },
				{ thing: "lols", id: 1 },
			],
			"group1"
		)
		// myCollection.collect([
		// 	{ thing: "lol", id: 0 },
		// 	{ thing: "lol3", id: 2 },
		// 	{ thing: "lols", id: 1 },
		// ])

		// can add to groups

		let watcherCalled = false
		// watch for any change on group1 using the shorthand method
		const rem = myCollection.watchGroup("group1", (group) => {
			console.log("group1 changed\n%o\n%o", group, myCollection.groups.group1.index)
			expect(group[0].thing).toBeDefined()
			watcherCalled = true
		})
		console.log(myCollection.getGroup("group1").index)
		expect(watcherCalled).toBe(false)
		myCollection.update(2, { thing: "lol2" })

		expect(watcherCalled).toBe(true)

		rem()
		watcherCalled = false

		const rem2 = myCollection.getGroup("group1").watch((group) => {
			console.log("group1 changed\n%o\n%o", group, myCollection.groups.group1.index)
			expect(group[0].thing).toBeDefined()
			watcherCalled = true
		})

		expect(watcherCalled).toBe(false)
		myCollection.update(1, { thing: "lol3" })

		expect(watcherCalled).toBe(true)

		rem2()
	})

	test("Watching Selectors", () => {
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: "lol", id: 5 }, "group1")

		let watcherCalled = false
		// watch for any change on selector main
		myCollection.getSelector("main").watch((value) => {
			console.log("selector changed\n%o\n%o", value, myCollection.getSelector("main").value)
			expect(value).toBeDefined()
			watcherCalled = true
		})

		expect(watcherCalled).toBe(false)
		// does update cause the watcher to be called?
		myCollection.getSelector("main").select(5)
		myCollection.update(5, { thing: "lol2", id: 5 })

		expect(watcherCalled).toBe(true)
		watcherCalled = false

		// // does `collect` cause the watcher fire?
		// myCollection.collect({ thing: "lol2", id: 9 }, "group1")

		// expect(watcherCalled).toBe(true)
	})
	test("Watching Data", () => {
		myCollection.collect([
			{ thing: "lol", id: 0 },
			{ thing: "lol3", id: 2 },
			{ thing: "lols", id: 1 },
		])

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: "lol", id: 5 }, "group1")
		myCollection.getSelector("main").select(5)

		let watcherCalled = false
		// watch for any change on group1
		myCollection.getSelector("main").data.watch((value) => {
			console.log("selector changed\n%o\n%o", value, myCollection.getSelector("main").value)
			expect(value).toBeDefined()
			watcherCalled = true
		})
		expect(watcherCalled).toBe(false)
		myCollection.update(5, { thing: "lol2", id: 5 })

		expect(watcherCalled).toBe(true)
	})

	test("Deleting data", () => {
		myCollection.collect(
			[
				{ thing: "lol", id: 0 },
				{ thing: "lol3", id: 2 },
				{ thing: "lols", id: 1 },
			],
			"group1"
		)
		expect(myCollection.value.length).toBe(3)

		myCollection.getItem(1).delete()

		expect(myCollection.value.length).toBe(2)
		expect(myCollection.getGroup("group1").value.length).toBe(2)
	})

	test("Removing data (from groups)", () => {
		myCollection.collect(
			[
				{ thing: "lol", id: 0 },
				{ thing: "lol3", id: 2 },
				{ thing: "lols", id: 1 },
			],
			"group1"
		)
		expect(myCollection.value.length).toBe(3)

		myCollection.remove(1, "group1")

		expect(myCollection.value.length).toBe(3)

		expect(myCollection.getGroup("group1").value.length).toBe(2)
	})
})
