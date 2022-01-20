import { collection, PlexusCollectionInstance } from "../src"

let myCollection: PlexusCollectionInstance<{thing: string, 'id': number}>

beforeEach(() => {
	myCollection = collection<{thing: string, 'id': number}>().createGroup('group1')
})
describe('Testing Collection', () => {
	test('Can create collection', () => {
		myCollection.collect({thing: 'lol', 'id': 0})
		myCollection.collect([{thing: 'lol3', 'id': 2}, {thing: 'lols', id: 1}])
		expect(myCollection.value[0].thing).toBe('lol')
		expect(myCollection.value[1].thing).toBe('lol3')
		expect(myCollection.value[2].thing).toBe('lols')
		
		expect(myCollection.getItemValue(0).thing).toBe('lol')
		expect(myCollection.getItemValue(2).thing).toBe('lol3')
		expect(myCollection.getItemValue(1).thing).toBe('lols')
	})
	test('testing groups', () => {
		myCollection.collect([{thing: 'lol', 'id': 0},{thing: 'lol3', 'id': 2}, {thing: 'lols', id: 1}])
		myCollection.collect([{thing: 'lol', 'id': 0},{thing: 'lol3', 'id': 2}, {thing: 'lols', id: 1}])
		expect(myCollection.value.length).toBe(3)
		expect(myCollection.value[0].thing).toBe('lol')
		expect(myCollection.value[1].thing).toBe('lol3')
		expect(myCollection.value[2].thing).toBe('lols')
		expect(myCollection.getItemValue(0).thing).toBe('lol')
		expect(myCollection.getItemValue(2).thing).toBe('lol3')
		expect(myCollection.getItemValue(1).thing).toBe('lols')
		
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({thing: 'lol', 'id': 5}, 'group1')
		expect(myCollection.getGroupsOf(5)).toBeDefined()
		// console.log(myCollection.getGroupsOf(5))
		// console.log(myCollection.groups)
		myCollection.groups
		expect(myCollection.groups.group1.length).toBe(1)
		expect(myCollection.groups.group1[0].value.id).toBe(5)
		myCollection.groups.group1[0].set({thing: 'lol', 'id': 0})
		expect(myCollection.groups.group1[0].value.id).toBe(5)
		console.log(myCollection.getGroup('group1').value)
		myCollection.update(5, {thing: 'idk' })
		console.log(myCollection.getGroup('group1').value)
		expect(myCollection.getItemValue(5).thing).toBe('idk')
		expect(myCollection.getGroup('group1')).toBeDefined()
		expect(myCollection.getGroup('group1').value[0].thing).toBe('idk')

		
	})
})