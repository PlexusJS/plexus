import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { action, preaction, PlexusAction } from '@plexusjs/core'

describe('Testing Action Function', () => {
	test('Can run a Function', () => {
		let waited = false,
			numb = 0,
			day = '',
			obj = {}

		preaction(() => {
			waited = true
		})
		preaction(() => {
			numb = 1
		})
		preaction(() => {
			day = 'Monday'
		})
		preaction(() => {
			obj = {
				test: 'test',
			}
		})
		const myAction = action(({}) => {
			return waited ? 'resolved' : 'waiting'
		})
		const data = myAction()
		expect(data).toBe('resolved')
		expect(numb).toBe(1)
		expect(day).toBe('Monday')
		expect(obj).toEqual({
			test: 'test',
		})
	})
})
