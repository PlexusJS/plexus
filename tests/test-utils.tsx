import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { collection } from '@plexusjs/core'
import { state } from '@plexusjs/core'

const AllTheProviders = ({ children }) => {
	return <>{children} </>
}

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }

export type User = {
	id: string
	firstName: string
	appointmentId: string
}
export type UserLite = {
	id: string
	firstName: string
}
export type UserLiteExplicitIdName = {
	userId: string
	firstName: string
}
export type Appointment = {
	id: string
	name: string
	date: number
	userId: string
}
export type ObjectStateExample = Partial<{
	a: { a?: boolean; b?: boolean }
	b: boolean
	c: { b?: boolean }
}>

// STATE 🧷
export const initialStateValues = {
	boolean: true,
	string: 'Hello Plexus!',
	object: { a: { a: true, b: true }, b: true },
	array: [
		{ item: 'Hello', item2: { subitem: 'World' } },
		{ item: 'Goodbye', item2: { subitem: 'People' } },
	],
	null: null,
}
export const booleanState = state(true)
export const stringState = state('Hello Plexus!')
export const stringStateStartingWithNull = state<string>(null)
export const objectState = state<ObjectStateExample>(initialStateValues.object)
export const arrayState = state<{ item?: string; item2?: { subitem?: string } }[]>(
	initialStateValues.array
)

export const stateWithFetchFnTest = state(() => {
	return 'some sort of data'
})
export const users = collection<User>({
	primaryKey: 'id',
	name: 'users',
	foreignKeys: {
		appointmentId: {
			newKey: 'appointment',
			reference: 'appointments', // looks for the id(s) here
		},
	},
}).createSelector('batched')

export const usersLite = collection<UserLite>({
	primaryKey: 'id',
	name: 'userslite',
}).createSelector('batched')

export const uniqueGroups = collection<UserLiteExplicitIdName>({
	primaryKey: 'userId',
	name: 'userslite',
	defaultGroup: 'upcoming',
	uniqueGroups: true
}).createSelector('batched')

export const DEFAULT_DECAY_RATE = 12_000
export const decayingUsers = collection<UserLiteExplicitIdName>({
	primaryKey: 'userId',
	name: 'userslite',
	defaultGroup: 'upcoming',
	uniqueGroups: true,
	decay: DEFAULT_DECAY_RATE
}).createSelector('batched')

export const appointments = collection<Appointment>({
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

export const myCollection = collection<{
	thing: string
	id: number
	obj?: {
		arr: {
			item1: string
			name?: string
		}[]
	}
}>({
	defaultGroup: true,
	sort(a, b) {
		return a.thing.localeCompare(b.thing)
	},
})
	.createGroups(['group1', 'group2'])
	.createSelector('main')
export const myCollectionUndefined = collection<{ thing: string; id: number }>({
	defaultGroup: true,
})
	.createGroups(['group1', 'group2'])
	.createSelector('main')