import { describe, test } from 'vitest'
import { DEFAULT_DECAY_RATE, decayingUsers } from './test-utils'

describe('Ephemeral Collection data', () => {
	test(
		'Does decaying data work?',
		(ctx) =>
			new Promise((resolve) => {
				decayingUsers.collect({ firstName: 'Bill', userId: '0' })
				expect(decayingUsers.value.length).toBe(1)
				expect(decayingUsers.value[0].firstName).toBe('Bill')
				expect(decayingUsers.value[0].userId).toBe('0')
				setTimeout(() => {
					expect(decayingUsers.value.length).toBe(0)
					console.log('done! Thing is decayed!')
					resolve(true)
				}, DEFAULT_DECAY_RATE + 10)
			}),
		DEFAULT_DECAY_RATE + 100
	)
	test(
		'Does decaying data refresh on set?',
		(ctx) =>
			new Promise((resolve) => {
				decayingUsers.collect({ firstName: 'Bill', userId: '0' })
				expect(decayingUsers.value.length).toBe(1)
				expect(decayingUsers.value[0].firstName).toBe('Bill')
				expect(decayingUsers.value[0].userId).toBe('0')
				// recollecting should reset the decay timer
				setTimeout(() => {
					expect(decayingUsers.value.length).toBe(1)
					decayingUsers.collect({ firstName: 'Bill', userId: '0' })
				}, DEFAULT_DECAY_RATE - 10)
				// so if we wait a bit, it should still be there
				setTimeout(() => {
					console.log('wtfff')
					expect(decayingUsers.value.length).toBe(1)
				}, DEFAULT_DECAY_RATE + 10)
				// and then it should decay past the decay rate
				setTimeout(
					() => {
						expect(decayingUsers.value.length).toBe(0)
						console.log('done! Thing is decayed!')
						resolve(true)
					},
					DEFAULT_DECAY_RATE * 2 + 10
				)
			}),
		{
			timeout: DEFAULT_DECAY_RATE * 2 + 100,
		}
	)
})
