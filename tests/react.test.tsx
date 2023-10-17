import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import '@testing-library/react'
import { screen, waitFor, within } from '@testing-library/react'
import { render, act } from './test-utils'
import { collection, computed, instance, state, event } from '@plexusjs/core'
import React, { FC, useEffect, useState } from 'react'
import { useDeposit, usePlexusEvent, usePlexus } from '@plexusjs/react'

type Payload = {
	name: string
	status: string
}

const myEvents = event<Payload>()
const stringState = state('yes')
const numberState = state(1)
const objectState = state<Partial<{ name: string }>>({ name: 'test' })
instance({ logLevel: 'debug' })
const computedState = computed(() => {
	console.log('RUNNING THE COMP STATE VALUE')
	return stringState.value.length * 2
}, [stringState])
instance({ logLevel: 'silent' })
const myCollection = collection<{ id: string; a: number }>()
	.createGroup('test')
	.createSelector('MAIN')

beforeEach(() => {
	myCollection.collect({ id: 'poggers', a: 2 }, ['test'])
})

afterEach(() => {
	numberState.reset()
	stringState.reset()
	objectState.reset()
	computedState.reset()

	myCollection.clear()
})
const RandomComponent: FC = () => {
	const str = usePlexus(stringState)
	const [compu, num] = usePlexus([computedState, numberState])
	const [groupValue, stateItem] = usePlexus([
		myCollection.getGroup('test'),
		numberState,
	])
	const obj = usePlexus(objectState)
	const [groupTest] = usePlexus([myCollection.groups.test])
	const [MAIN] = usePlexus([myCollection.selectors.MAIN])

	useEffect(() => {
		myCollection.collect({ id: 'pog', a: 1 }, 'test')
	}, [])

	return (
		<div>
			<p data-testid='str'>{str}</p>
			<p data-testid='compu'>{compu}</p>
			<p data-testid='num'>{num}</p>
			<strong data-testid='obj-property'>{obj.name}</strong>
			<p data-testid='group-test'>{JSON.stringify(groupTest)}</p>
			<p data-testid='selector-string'>{JSON.stringify(MAIN)}</p>
		</div>
	)
}
describe('Test react integration (usePlexus)', () => {
	// test('usePlexus hook w/ Collections', async () => {})
	// test('usePlexus hook w/ Computed', async () => {})
	// test('usePlexus hook w/ Computed', async () => {})

	test('usePlexus hook w/ State', async () => {
		// console.log(Array.from(instance()._states).map((v) => v.id))
		render(<RandomComponent />)
		await act(async () => {
			await waitFor(() => screen.getByTestId('str'))
		})
		expect(screen.getByTestId('str').innerHTML).toBe('yes')
		expect(screen.getByTestId('group-test').innerHTML).toBe(
			`[{"id":"poggers","a":2},{"id":"pog","a":1}]`
		)
		await act(async () => {
			myCollection.collect({ id: 'pog', a: 2 }, 'test')
			myCollection.collect({ id: '3', a: 2 }, 'test')
			await waitFor(() => screen.getByTestId('group-test'))
			myCollection.selectors.MAIN.select('3')
		})
		expect(screen.getByTestId('group-test').innerHTML).toBe(
			`[{"id":"poggers","a":2},{"id":"pog","a":2},{"id":"3","a":2}]`
		)
		expect(screen.getByTestId('selector-string').innerHTML).toBe(
			`{"id":"3","a":2}`
		)
		// instance({ logLevel: "debug" })
		instance({ logLevel: 'debug', id: 'react' })
		expect(screen.getByTestId('compu').innerHTML).toBe('6')
		await act(async () => {
			// test computed render
			stringState.set('comp')
			await waitFor(() => screen.getByTestId('compu'))
		})
		expect(screen.getByTestId('compu').innerHTML).toBe('8')

		expect(
			Array.from(instance()._computedStates.entries()).find(
				(obj) => obj[1].id === computedState.id
			)?.[1].value
		).toBe(8)
		await act(async () => {
			stringState.set('no')
			await waitFor(() => screen.getByTestId('str'))
		})
		expect(screen.getByTestId('compu').innerHTML).toBe('4')
		instance({ logLevel: 'silent', id: 'react' })
		expect(screen.getByTestId('str').innerHTML).toBe('no')
	})
})

describe('Test react integration (useEvent)', () => {
	test('test useEvent', () => {
		const RandomComponent: FC = () => {
			const [val, setVal] = useState('')
			usePlexusEvent(myEvents, (payload) => {
				setVal(payload.name)
			})

			useEffect(() => {
				myEvents.emit({ name: 'test', status: 'test' })
			}, [])
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id='data'>{val}</p>
				</div>
			)
		}
		let component = render(<RandomComponent />)
		// act(() => {
		// 	component.ch(<RandomComponent />)
		// })

		// act(() => {
		// 	component.update(<RandomComponent />)
		// })
		component.findByTestId('data').then((v) => {
			expect(v.innerHTML).toEqual('test')
		})
		// expect(tree).toMatchSnapshot()
	})
})

describe('Test react integration (useDeposit)', () => {
	test('test useDeposit', () => {
		// lol idk how to test this without user input
		const RandomComponent: FC = () => {
			const [val, setVal] = useState('')
			const { save, edit } = useDeposit(
				{ name: 'string' },
				{
					onSave(payload) {
						setVal(payload.name ?? '')
					},
				}
			)

			useEffect(() => {
				myEvents.emit({ name: 'test', status: 'test' })
			}, [])
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id='data'>{val}</p>
				</div>
			)
		}
		let tree: any
		const component = render(<RandomComponent />)

		// expect(tree.toJSON()).toMatchSnapshot()
		// expect().toEqual()
		// expect(tree.root.findByProps({ id: "data" }).children).toEqual(["test"])
	})
	test('test useDeposit edit', () => {
		const def: { name?: string } = {}
		const RandomComponent: FC = () => {
			const [val, setVal] = useState('')
			const { value, save, edit } = useDeposit(
				{ ...def },
				{
					onEdit(k, v) { },
					onSave(payload) {
						setVal(payload.name ?? '')
					},
				}
			)

			useEffect(() => {
				edit('name', 'billy')
			}, [])

			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id='data'>{JSON.stringify(value)}</p>
				</div>
			)
		}
		let component = render(<RandomComponent />)

		// act(() => {
		// 	component.update(<RandomComponent />)
		// })
		// let tree = toJson(component)
		// act(() => {
		// 	component.update(<RandomComponent />)
		// })
		component.findByTestId('data').then((v) => {
			expect(v.innerHTML).toEqual(['{"name":"billy"}'])
		})
		// expect(tree).toMatchSnapshot()
		// expect().toEqual()
		// expect(tree.root.findByProps({ id: "data" }).children).toEqual(["test"])
	})
	test('testing types of useDeposit', () => {
		function RandomComponent() {
			const [val, setVal] = useState('')
			const { save, edit } = useDeposit<Payload>(
				{ name: 'string' },
				{
					onSave(payload) {
						setVal(payload.name ?? '')
					},
				}
			)
			// const [groupValue] = usePlexus([myCollection.groups.test])
			return (
				<div>
					<p id='data'>{val}</p>
				</div>
			)
		}
	})
	test('testing usePlexus ', async () => {
		// render(<RandomComponent />)
		// await act(async () => {
		// 	await waitFor(() => screen.getByTestId('str'))
		// })
		// expect(screen.getByTestId('str').innerHTML).toBe('yes')
		// expect(screen.getByTestId('group-test').innerHTML).toBe(
		// 	`[{"id":"poggers","a":2},{"id":"pog","a":1}]`
		// )
	})
})
