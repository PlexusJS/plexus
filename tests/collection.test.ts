import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { collection, instance, PlexusCollectionInstance } from '@plexusjs/core'
import {
	appointments,
	users,
	uniqueGroups,
	decayingUsers,
	DEFAULT_DECAY_RATE,
	myCollection,
	myCollectionUndefined,
} from './test-utils'

// instance({ logLevel: "debug" })
beforeEach(() => {
	myCollection.clear()
	myCollectionUndefined.clear()
})
describe('Testing Collection', () => {
	test('Watching Data', () => {
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: 'lol', id: 5 }, 'group1')
		myCollection.getSelector('main').select('5')

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
		myCollection.update('5', { thing: 'lol2', id: 5 })

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

		myCollection.getItem('1')?.delete()

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

		myCollection.update('2', { thing: 'lol2' })
		expect(myCollection.lastUpdatedKey).toBe('2')
		myCollection.update('1', { thing: 'lol5' })
		expect(myCollection.lastUpdatedKey).toBe('1')
		expect(myCollection.value.length).toBe(3)
	})

	test('Can patch a data item', () => {
		myCollection.collect(
			[
				{ thing: 'lol', id: 0 },
				{ thing: 'lol3', id: 2 },
				{
					id: 1,
					thing: 'lols',
					obj: {
						arr: [{ item1: 'item1' }, { item1: 'item2' }],
					},
				},
			],
			'group1'
		)

		expect(myCollection.value.length).toBe(3)
		myCollection.selectors.main.select('1')
		myCollection.selectors.main.data?.patch({
			thing: 'lol2',
			obj: { arr: [{ item1: 'item3', name: 'yes' }] },
		})
		expect(myCollection.value.length).toBe(3)
		expect(myCollection.getSelector('main').value.thing).toBe('lol2')
		expect(myCollection.getSelector('main').value.obj?.arr[0].item1).toBe(
			'item3'
		)
		expect(myCollection.getSelector('main').value.obj?.arr[0].name).toBe('yes')

		// patch with a thinner object
		myCollection.update(
			'1',
			{ thing: 'lol3' },
			{
				deep: true,
			}
		)
		expect(myCollection.getSelector('main').value.thing).toBe('lol3')
		expect(myCollection.getSelector('main').value.obj?.arr[0].item1).toBe(
			'item3'
		)
		expect(myCollection.getSelector('main').value.obj?.arr[0].name).toBe('yes')
	})

	test('Can a provisional Data item stay reactive', () => {
		console.log('Check...')
		instance({ logLevel: 'debug' })
		myCollection.getItem('15')?.watch((v) => {
			console.log(`new data`, v)
		})
		console.log(myCollection.getItem('15')?.value)
		myCollection.getItem('15')?.set({ thing: 'provisional no more' })
		console.log('wtf')
		console.log(myCollection.getItemValue('15'))
		instance({ logLevel: undefined })
	})

	test('Does the has method work properly', () => {
		myCollection.getItem('678i2')
		expect(myCollection.getItemValue('678i2')).toBeUndefined()
		expect(myCollection.has('678i2')).toBe(false)
	})
	test('Does the size property work properly', () => {
		myCollection.getItem('678i2')
		expect(myCollection.size).toBe(1)
		myCollection.collect({ thing: 'lol', id: 0 })
		expect(myCollection.size).toBe(2)
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
		expect(myCollection.getGroupsOf('5')).toEqual(['default', 'group1'])

		myCollection.collect({ thing: 'yay', id: 12 }, ['group1'])
		expect(myCollection.getGroupsOf('12')).toEqual(['default', 'group1'])
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
		myCollection.update('5', { thing: 'idk' })
		// console.log(myCollection.getGroup('group1').value)
		expect(myCollection.getItemValue('5')?.thing).toBe('idk')
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
		myCollection.delete('1')
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
		myCollection.update('2', { thing: 'lol2' })

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
		myCollection.update('1', { thing: 'lol3' })

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

		myCollection.removeFromGroups('1', 'group1')

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
		myCollection.delete('1')
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
		expect(computedCollection.getItemValue('x')?.backwards).toBe('kcaj')
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
		myCollection.delete('1')
		expect(deleted).toBe(true)

		myCollection.update('2', { thing: 'lol2' })
		expect(updated).toBe(true)

		expect(myCollection.getGroup('default').value.length).toBe(2)
	})

	// a unit test for sorting with groups
	test('Sorting with groups', () => {
		myCollection

			.createGroup('sorted', {
				sort(a, b) {
					return a.thing.localeCompare(b.thing)
				},
			})
			.collect(
				[
					{ thing: '0', id: 0 },
					{ thing: '2', id: 2 },
					{ thing: '1', id: 1 },
				],
				'sorted'
			)

		expect(myCollection.getGroup('sorted').value[0].thing).toBe('0')
		expect(myCollection.getGroup('sorted').value[1].thing).toBe('1')
		expect(myCollection.getGroup('sorted').value[2].thing).toBe('2')
	})
	test('Sorting with dynamic groups', () => {
		myCollection.collect(
			[
				{ thing: '0', id: 0 },
				{ thing: '2', id: 2 },
				{ thing: '1', id: 1 },
			],
			'dynamic'
		)

		expect(myCollection.getGroup('dynamic').value[0].thing).toBe('0')
		expect(myCollection.getGroup('dynamic').value[1].thing).toBe('1')
		expect(myCollection.getGroup('dynamic').value[2].thing).toBe('2')
	})
	test('Unique Groups when setting groups for data', () => {
		uniqueGroups.collect(
			[
				{ firstName: 'Jack', userId: '0' },
				{ firstName: 'Doe', userId: '1' },
				{ firstName: 'Kane', userId: '2' },
			],
			'dynamic'
		)
		// expect(uniqueGroups.getGroup('dynamic').value.length).toBe(3)
		// should only add to one group
		uniqueGroups.addToGroups('0', ['group1', 'group2'])
		console.log(uniqueGroups.getGroupsOf('0'))
		expect(uniqueGroups.getGroupsOf('0').length).toBe(2)
		expect(uniqueGroups.getGroup('dynamic').value.length).toBe(2)
		expect(uniqueGroups.getGroup('group1').value.length).toBe(0)
		expect(uniqueGroups.getGroup('group2').value.length).toBe(1)
		// recollect the data
		uniqueGroups.collect([{ firstName: 'Jack', userId: '0' }], 'dynamic')
		expect(uniqueGroups.getGroupsOf('0').length).toBe(2)
		expect(uniqueGroups.getGroup('dynamic').value.length).toBe(3)
		expect(uniqueGroups.getGroup('group1').value.length).toBe(0)
		expect(uniqueGroups.getGroup('group2').value.length).toBe(0)
	})

	test('Unique Groups should not toggle', () => {
		uniqueGroups.collect(
			[
				{ firstName: 'Jack', userId: '0' },
				{ firstName: 'Doe', userId: '1' },
				{ firstName: 'Kane', userId: '2' },
			],
			'dynamic'
		)
		// should only add to one group
		uniqueGroups.addToGroups('0', 'group2')
		console.log(uniqueGroups.getGroupsOf('0'))
		// two is default and group2 (last group in the array) and
		expect(uniqueGroups.getGroupsOf('0').length).toBe(2)
		expect(uniqueGroups.getGroup('dynamic').value.length).toBe(2)
		expect(uniqueGroups.getGroup('group2').value.length).toBe(1)
		// recollect the data
		uniqueGroups.collect([{ firstName: 'Jack', userId: '0' }], 'group2')
		expect(uniqueGroups.getGroupsOf('0').length).toBe(2)
		expect(uniqueGroups.getGroup('dynamic').value.length).toBe(2)
		expect(uniqueGroups.getGroup('group2').value.length).toBe(1)
	})
})
describe('testing collection selectors', () => {
	test('Do Selectors Work?', () => {
		expect(myCollection.value.length).toBe(0)
		const ref = { numOfLoops: 0 }
		const del = myCollection.selectors.main.watch((v, from) => {
			console.log(
				`${new Date().getTime()} selector watcher invoked from "${from}" with value: `,
				v
			)
			expect(v.thing).toBeDefined()
			ref.numOfLoops = ref.numOfLoops + 1
		})
		expect(ref.numOfLoops).toBe(0)

		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])
		// instance().settings.logLevel = 'debug'
		myCollection.getSelector('main').select('0')
		expect(ref.numOfLoops).toBe(1)
		// console.log(myCollection.getSelector("main").key)

		expect(myCollection.selectors.main.value?.id).toBe('0')
		expect(myCollection.selectors.main.value?.thing).toBe('lol')

		console.log(myCollection.selectors.main.value?.thing)
		myCollection.update('0', { thing: 'haha' })
		expect(ref.numOfLoops).toBe(2)
		console.log(myCollection.selectors.main.value?.thing)
		expect(myCollection.selectors.main.key).toBe('0')
		expect(myCollection.selectors.main.value?.thing).toBe('haha')

		myCollection.selectors.main.select('1')
		console.log(myCollection.selectors.main.value?.thing)
		expect(myCollection.selectors.main.value?.id).toBe('1')
		expect(myCollection.selectors.main.value?.thing).toBe('lols')
		expect(ref.numOfLoops).toBe(3)

		del()
	})

	test('Watching Selectors', () => {
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol2', id: 2 },
			{ thing: 'lol1', id: 1 },
		])

		// can add to groups
		// console.log(myCollection.getGroupsOf(5))
		myCollection.collect({ thing: 'lol', id: 5 }, 'group1')
		myCollection.collect({ thing: 'lol3', id: 3 }, 'group1')

		let watcherCalled = 0
		// watch for any change on selector main
		const kill = myCollection.selectors.main.watch((value) => {
			console.log(
				'selector changed\n%o\n%o',
				value,
				myCollection.getSelector('main').value
			)
			expect(value).toBeDefined()
			watcherCalled = watcherCalled + 1
		})

		expect(watcherCalled).toBe(0)
		// does update cause the watcher to be called?
		myCollection.getSelector('main').select('5')
		myCollection.update('5', { thing: 'lol2', id: 5 })

		expect(watcherCalled).toBe(2)

		myCollection.getSelector('main').patch({ thing: 'lolUpdated' })
		expect(myCollection.getSelector('main').value?.thing).toBe('lolUpdated')
		expect(watcherCalled).toBe(3)

		// does delete cause the watcher to be called?
		myCollection.delete('5')

		expect(watcherCalled).toBe(3)

		// // does `collect` cause the watcher fire?
		// myCollection.collect({ thing: "lol2", id: 9 }, "group1")

		// expect(watcherCalled).toBe(true)
		kill()
	})
	test('Checking selector history functionality', () => {
		// instance({ logLevel: 'debug' })
		myCollection.collect([
			{ thing: 'lol', id: 0 },
			{ thing: 'lol3', id: 2 },
			{ thing: 'lols', id: 1 },
		])

		myCollection.selectors.main.select('0')
		myCollection.selectors.main.history()

		myCollection.selectors.main.watch((v) => {
			console.log('Got an update from history change!', v)
		})
		console.log('setting the data...')
		myCollection.selectors.main.patch({ thing: 'new' })

		// console.log("1: checking", objectState.value, "vs.", { a: { b: false } })
		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'new',
			id: '0',
		})
		console.log('undoing...')
		myCollection.selectors.main.undo()
		console.log('undo complete...')
		// console.log("2: checking", objectState.value, "vs.", initialValue.object)
		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'lol',
			id: '0',
		})
		console.log('redoing...')
		myCollection.selectors.main.redo()
		console.log('redo complete...')

		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'new',
			id: '0',
		})

		console.log('undoing...')
		myCollection.selectors.main.undo()
		console.log('undo complete...')
		// console.log("2: checking", objectState.value, "vs.", initialValue.object)
		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'lol',
			id: '0',
		})
		console.log('redoing...')
		myCollection.selectors.main.redo()
		console.log('redo complete...')

		expect(myCollection.selectors.main.value).toStrictEqual({
			thing: 'new',
			id: '0',
		})
		// instance({ logLevel: undefined })

		// instance({ logLevel: 'debug' })
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

		// instance({ logLevel: undefined })
	})
	test('checking if we can initialize a selector with a default primary key', () => {
		const myCollection = collection<{
			id: string
			name: string
		}>().createSelector('main', '1')
		expect(myCollection.selectors.main.data).toBeDefined()
		myCollection.collect([
			{ id: '1', name: 'jack' },
			{ id: '2', name: 'jill' },
		])
		expect(myCollection.selectors.main.value?.id).toBe('1')
		expect(myCollection.selectors.main.value).toEqual({ id: '1', name: 'jack' })
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

describe('testing collection relations', () => {
	test('shallow injecting', () => {
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

		// users.getItem('1').syncForeignKeyData()
		// Checking foreign
		expect(users.getItem('1').value).toBeDefined()
		console.log('found appointment', users.getItem('1').value.appointment)
		expect(users.value[0].appointment?.name).toBe('test')
		expect(users.getItem('1').value.appointment?.name).toBe('test')

		// Checking foreign
		expect(appointments.getItem('1').value.user).toBeDefined()
		console.log(appointments.getItem('1').value.user)
		expect(appointments.value[0].user?.firstName).toBe('John')
		expect(appointments.getItem('1').value.user.firstName).toBe('John')
		console.log(appointments.value)

		// does the unfoundKeyReturnsUndefined configuration work
		expect(users.getItemValue('3')).toBeUndefined()
		console.log('an undefined object', users.getItemValue('3'))
	})
	test('shallow array injecting', () => {
		const c1 = collection<{
			id: string
			name: string
		}>({
			name: 'c1',
		})
		const c2 = collection<{
			id: string
			c1ids: string[]
			c1s?: { id: string; name: string }[]
		}>({
			name: 'c2',
			foreignKeys: {
				c1ids: {
					reference: 'c1',
					newKey: 'c1s',
				},
			},
		})
		c1.collect([
			{ id: '1', name: 'c1-1' },
			{ id: '2', name: 'c1-2' },
		])
		c2.collect([
			{ id: '1', c1ids: ['1', '2'] },
			{ id: '2', c1ids: ['1'] },
		])
		expect(c2.getItemValue('1')?.c1s?.length).toBe(2)
		expect(c2.getItemValue('1')?.c1s?.[0]).toMatchObject({
			id: '1',
			name: 'c1-1',
		})
	})
	test('do relations work with provisional data?', () => {
		// instance({ logLevel: 'debug' })

		const c1 = collection<{
			id: string
			name: string
		}>({
			name: 'c1',
		})

		let watcherCalled = 0

		const c2 = collection<{
			id: string
			c1id: string
			c1s?: { id: string; name: string }[]
		}>({
			name: 'c2',
			foreignKeys: {
				c1id: {
					reference: 'c1',
					newKey: 'c1s',
				},
			},
		})

		expect(watcherCalled).toBe(0)

		console.log(c1.getItemValue('1'))
		c1.getItem('1').watch((v) => {
			console.log('new data', v)
			watcherCalled = watcherCalled + 1
		})

		c2.collect([{ id: '1', c1id: '1' }])

		c1.collect([
			{ id: '1', name: 'c1-1' },
			{ id: '2', name: 'c1-2' },
		])
		console.log(c1.getItemValue('1'))

		console.log('watcher called', watcherCalled)
		console.log('c2', c2.getItemValue('1'))
		// instance({ logLevel: undefined })
		expect(watcherCalled).toBe(1)

		expect(c2.getItemValue('1')?.c1s).toMatchObject({
			id: '1',
			name: 'c1-1',
		})
		c1.collect({ id: '3', name: 'c1-3' })
		// expect(watcherCalled).toBe(2)
	})
})
