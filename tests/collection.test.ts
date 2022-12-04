import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { collection, instance, PlexusCollectionInstance } from '@plexusjs/core'

const myCollection = collection<{
	thing: string
	id: number
	obj?: {
		arr: {
			item1: string
		}[]
	}
}>({ defaultGroup: true })
	.createGroups(['group1', 'group2'])
	.createSelector('main')
const myCollectionUndefined = collection<{ thing: string; id: number }>({
	defaultGroup: true,
	unfoundKeyReturnsUndefined: true,
})
	.createGroups(['group1', 'group2'])
	.createSelector('main')

// instance({ logLevel: "debug" })
beforeEach(() => {
	myCollection.clear()
})
describe('Testing Collection', () => {
	test('Can create collection', () => {
		expect(myCollection.value.length).toBe(0)
		// can properly collect data
		myCollection.collect({ thing: 'lol', id: 0 })
		expect(myCollection.value.length).toBe(1)
		// myCollection.getSelector("")
		// myCollection.getGroup("group1")
		myCollection.collect([
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])
		// can return the data values as an array
		expect(myCollection.value[0].thing).toBe('lol')
		expect(myCollection.value[1].thing).toBe('lol3')
		expect(myCollection.value[2].thing).toBe('lols')

		// can properly retrieve data values
		expect(myCollection.getItemValue(0)?.thing).toBe('lol')
		expect(myCollection.getItemValue(2)?.thing).toBe('lol3')
		expect(myCollection.getItemValue(1)?.thing).toBe('lols')

		// does the unfoundKeyReturnsUndefined configuration work
		expect(myCollectionUndefined.getItemValue(0)).toBeUndefined()
	})
	test('Does it pass the vibe check ?', () => {
		myCollection.collect({ thing: 'xqcL', id: 0 })
		expect(myCollection.getItem(0).value?.thing).toBe('xqcL')
	})

	test('Watching Data', () => {
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: 'lol', id: 5 }, 'group1')
		myCollection.getSelector('main').select(5)

		let watcherCalled = false
		// watch for any change on group1
		myCollection.selectors.main.data?.watch((value) => {
			console.log(
				'selector changed\n%o\n%o',
				value,
				myCollection.getSelector('main').value
			)
			expect(value).toBeDefined()
			watcherCalled = true
		})
		expect(watcherCalled).toBe(false)
		myCollection.update(5, { thing: 'lol2', id: 5 })

		expect(watcherCalled).toBe(true)
	})

	test('Deleting data', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)
		expect(myCollection.value.length).toBe(3)

		myCollection.getItem(1).delete()

		expect(myCollection.value.length).toBe(2)
		expect(myCollection.getGroup('group1').value.length).toBe(2)
	})

	test('Checking lastUpdatedKey', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)

		expect(myCollection.value.length).toBe(3)

		myCollection.update(2, { thing: 'lol2' })
		expect(myCollection.lastUpdatedKey).toBe(2)
		myCollection.update(1, { thing: 'lol5' })
		expect(myCollection.lastUpdatedKey).toBe(1)
		expect(myCollection.value.length).toBe(3)
	})

	test('Checking if you can patch a data item', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)

		expect(myCollection.value.length).toBe(3)
		myCollection.selectors.main.select(1)
		myCollection.selectors.main.data?.patch({ thing: 'lol2' })
		expect(myCollection.value.length).toBe(3)
		expect(myCollection.getSelector('main').value.thing).toBe('lol2')
	})

	test('Can a provisional Data item stay reactive', () => {
		console.log('Check...')
		instance({ logLevel: 'debug' })
		myCollection.getItem(15).watch((v) => {
			console.log(`new data`, v)
		})
		console.log(myCollection.getItem(15).value)
		myCollection.getItem(15).set({ thing: 'provisional no more' })
		console.log('wtf')
		console.log(myCollection.getItem(15).value)
		instance({ logLevel: undefined })
	})
})
describe('testing collection groups', () => {
	test('Do Groups Work?', () => {
		console.log(JSON.stringify(myCollection, null, 2))
		expect(myCollection.value.length).toBe(0)
		// can properly collect objects with the same keys
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])
		console.log(JSON.stringify(myCollection, null, 2))

		expect(myCollection.value.length).toBe(3)

		// can properly export data values
		expect(myCollection.value[0].thing).toBe('lol')
		expect(myCollection.value[1].thing).toBe('lol3')
		expect(myCollection.value[2].thing).toBe('lols')

		// can add to groups
		myCollection.collect({ thing: 'lol', id: 5 }, 'group1')
		expect(myCollection.getGroupsOf(5)).toEqual(['default', 'group1'])

		myCollection.collect({ thing: 'yay', id: 12 }, ['group1'])
		expect(myCollection.getGroupsOf(12)).toEqual(['default', 'group1'])
		// console.log(myCollection.getGroupsOf(5))
		// console.log(myCollection.getGroup('group1').index)
		// console.log(myCollection.groups.group1.index)

		expect(myCollection.groups.group1.index.size).toBe(2)
		console.log(myCollection.groups, myCollection.groups.group1.value)

		// if we try to change the key of an item, it should do nothing and fail silently
		myCollection.groups.group1.data[0]?.set({ thing: 'lol', id: 0 })
		expect(myCollection.groups.group1.value[0].id).toBeDefined()
		// console.log(myCollection.getGroup('group1').value)

		// we should be able to update a data item and see it in all places we can get the item (in the collection, in the groups, etc)
		myCollection.update(5, { thing: 'idk' })
		// console.log(myCollection.getGroup('group1').value)
		expect(myCollection.getItemValue(5).thing).toBe('idk')
		expect(myCollection.getGroup('group1')).toBeDefined()
		expect(myCollection.getGroup('group1').value[0].thing).toBe('idk')

		// we should be able to have two groups that return different values :)
		myCollection.collect({ thing: 'hehe', id: 78 }, 'yes')
		expect(myCollection.getGroup('yes').value[0].thing).toBe('hehe')
		myCollection.collect({ thing: 'hoho', id: 96 }, 'no')
		expect(myCollection.getGroup('no').value[0]?.thing).toBe('hoho')
	})
	test('Using default group', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)
		expect(myCollection.getGroup('default').index.size).toBe(3)

		expect(myCollection.value.length).toBe(3)
		myCollection.delete(1)
		expect(myCollection.getGroup('default').value.length).toBe(2)
	})
	test('Watching Groups', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)
		// myCollection.collect([
		// 	{ thing: "lol", id: 0 },
		// 	{ thing: "lol3", id: 2 },
		// 	{ thing: "lols", id: 1 },
		// ])

		// can add to groups

		let watcherCalled = false
		// watch for any change on group1 using the shorthand method
		const rem = myCollection.watchGroup('group1', (group) => {
			console.log(
				'group1 changed\n%o\n%o',
				group,
				myCollection.groups.group1.index
			)
			expect(group[0].thing).toBeDefined()
			watcherCalled = true
		})
		console.log(myCollection.getGroup('group1').index)
		expect(watcherCalled).toBe(false)
		myCollection.update(2, { thing: 'lol2' })

		expect(watcherCalled).toBe(true)

		rem()
		watcherCalled = false

		const rem2 = myCollection.getGroup('group1').watch((group) => {
			console.log(
				'group1 changed\n%o\n%o',
				group,
				myCollection.groups.group1.index
			)
			expect(group[0].thing).toBeDefined()
			watcherCalled = true
		})

		expect(watcherCalled).toBe(false)
		myCollection.update(1, { thing: 'lol3' })

		expect(watcherCalled).toBe(true)

		rem2()
	})
	test('Clearing Groups', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)
		expect(myCollection.value.length).toBe(3)

		myCollection.clear('group1')

		expect(myCollection.value.length).toBe(3)

		expect(myCollection.getGroup('group1').value.length).toBe(0)
	})
	test('Removing data (from groups)', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)
		expect(myCollection.value.length).toBe(3)

		myCollection.removeFromGroup(1, 'group1')

		expect(myCollection.value.length).toBe(3)

		expect(myCollection.getGroup('group1').value.length).toBe(2)
	})

	test('Using default group', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)
		expect(myCollection.getGroup('default').index.size).toBe(3)

		expect(myCollection.value.length).toBe(3)
		myCollection.delete(1)
		expect(myCollection.getGroup('default').value.length).toBe(2)
	})

	test(`Do computed functions work ?`, () => {
		const computedCollection = collection<{
			id: string
			name: string
			backwards?: string
		}>().compute((data) => {
			data.backwards = data.name.split('').reverse().join('')
			return data
		})
		computedCollection.collect({
			id: 'x',
			name: 'jack',
		})
		expect(computedCollection.getItemValue('x').backwards).toBe('kcaj')
	})

	test('Collecting into a group, then ensuring the group is up to date', () => {
		let collected = false
		let deleted = false
		let updated = false
		myCollection.groups.group1.watch(() => {
			if (collected && deleted) updated = true
			if (collected) deleted = true
			collected = true
		})
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{ thing: 'lols', id: 1 },
			],
			'group1'
		)
		expect(collected).toBe(true)
		myCollection.delete(1)
		expect(deleted).toBe(true)

		myCollection.update(2, { thing: 'lol2' })
		expect(updated).toBe(true)

		expect(myCollection.getGroup('default').value.length).toBe(2)
	})
})
describe('testing collection selectors', () => {
	test('Do Selectors Work?', () => {
		expect(myCollection.value.length).toBe(0)
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])
		myCollection.getSelector('main').select(0)
		// console.log(myCollection.getSelector("main").key)

		const del = myCollection.getSelector('main').watch((v) => {
			console.log(v)
			expect(v.thing).toBe('haha')
		})
		expect(myCollection.getSelector('main').value?.thing).toBe('lol')
		myCollection.update(0, { thing: 'haha' })
		del()
		expect(myCollection.selectors.main.key).toBe(0)
		expect(myCollection.getSelector('main').value?.id).toBe(0)
		expect(myCollection.getSelector('main').value?.thing).toBe('haha')
	})

	test('Watching Selectors', () => {
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: 'lol', id: 5 }, 'group1')

		let watcherCalled = false
		// watch for any change on selector main
		const kill = myCollection.getSelector('main').watch((value) => {
			console.log(
				'selector changed\n%o\n%o',
				value,
				myCollection.getSelector('main').value
			)
			expect(value).toBeDefined()
			watcherCalled = true
		})

		expect(watcherCalled).toBe(false)
		// does update cause the watcher to be called?
		myCollection.getSelector('main').select(5)
		myCollection.update(5, { thing: 'lol2', id: 5 })

		expect(watcherCalled).toBe(true)
		watcherCalled = false

		// // does `collect` cause the watcher fire?
		// myCollection.collect({ thing: "lol2", id: 9 }, "group1")

		// expect(watcherCalled).toBe(true)
		kill()
	})
	test('Checking selector history functionality', () => {
		instance({ logLevel: 'debug' })
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])

		myCollection.selectors.main.select(0)
		myCollection.selectors.main.history()

		myCollection.selectors.main.watch((v) => {
			console.log('Got an update from history change!', v)
		})
		console.log('setting the data...')
		myCollection.selectors.main.patch({ thing: 'new' })

		// console.log("1: checking", objectState.value, "vs.", { a: { b: false } })
		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'new',
			id: 0,
		})
		console.log('undoing...')
		myCollection.selectors.main.undo()
		console.log('undo complete...')
		// console.log("2: checking", objectState.value, "vs.", initialValue.object)
		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'lol',
			id: 0,
		})
		console.log('redoing...')
		myCollection.selectors.main.redo()
		console.log('redo complete...')

		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'new',
			id: 0,
		})

		console.log('undoing...')
		myCollection.selectors.main.undo()
		console.log('undo complete...')
		// console.log("2: checking", objectState.value, "vs.", initialValue.object)
		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'lol',
			id: 0,
		})
		console.log('redoing...')
		myCollection.selectors.main.redo()
		console.log('redo complete...')

		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'new',
			id: 0,
		})
		instance({ logLevel: undefined })

		instance({ logLevel: 'debug' })
		myCollection.selectors.main.patch({
			thing: 'new',
			obj: {
				arr: [
					{
						item1: '1',
					},
				],
			},
		})
		expect(myCollection.selectors.main.value.obj?.arr[0].item1).toBe('1')
		const changedVal = myCollection.selectors.main.value
		changedVal.obj && (changedVal.obj.arr[0].item1 = '2')
		myCollection.selectors.main.patch({
			...changedVal,
		})
		expect(myCollection.selectors.main.value.obj?.arr[0].item1).toBe('2')

		instance({ logLevel: undefined })
	})
})

type Post = {
	id: string
	message: string
}
const posts = collection<Post>({
	primaryKey: 'id',
	defaultGroup: 'all',
})
describe('default group behavior', () => {
	test('can create a default group', () => {
		expect(posts.getGroup('all').value.length).toBe(0)
		posts.collect([
			{ id: '1', message: 'hello' },
			{ id: '2', message: 'hello2' },
		])
		console.log('adding posts...', posts.value, posts.groups)
		console.log(posts.config)
		expect(posts.groups.all).toBeDefined()
		expect(posts.value.length).toBe(2)
		expect(posts.groups.all.value.length).toBe(2)
		expect(posts.getGroup('all').value.length).toBe(2)
	})
})

type User = {
	id: string
	firstName: string
	appointmentId: string
}
type Appointment = {
	id: string
	name: string
	date: number
	userId: string
}

const appointments = collection<Appointment>({
	primaryKey: 'id',
	name: 'appointments',
	defaultGroup: 'upcoming',
	foreignKeys: {
		userId: {
			newKey: 'user',
			reference: 'users',
		},
	},
})
const users = collection<User>({
	primaryKey: 'id',
	name: 'users',
	foreignKeys: {
		appointmentId: {
			newKey: 'appointment',
			reference: 'appointments', // looks for the id(s) here
		},
	},
})

describe('testing collection relations', () => {
	test('', () => {
		users.collect({
			id: '1',
			firstName: 'John',
			appointmentId: '1',
		})
		appointments.collect({
			id: '1',
			name: 'test',
			date: 123,
			userId: '1',
		})
		expect(users.getItem('1').value.appointment).toBeDefined()
		console.log(users.getItem('1').value.appointment)
		expect(users.value[0].appointment?.name).toBe('test')
		expect(users.getItem('1').value.appointment.name).toBe('test')

		// Checking foreign
		expect(appointments.getItem('1').value.user).toBeDefined()
		console.log(appointments.getItem('1').value.user)
		expect(appointments.value[0].user?.firstName).toBe('John')
		expect(appointments.getItem('1').value.user.firstName).toBe('John')
		console.log(appointments.value)
	})
})
