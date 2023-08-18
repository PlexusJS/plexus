import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { collection } from '@plexusjs/core'

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
export type Appointment = {
	id: string
	name: string
	date: number
	userId: string
}
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

export const uniqueGroups = collection<UserLite>({
	primaryKey: 'id',
	name: 'userslite',
	uniqueGroups: true
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
