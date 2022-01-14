import { route, PlexusRoute, PlexusAction, event, state } from '../src'
import { instance } from '../src/instance';
import { PlexusEvent, PxState, PxStateInstance } from '../src/interfaces';

describe('Testing Event Function', () => {
	test('Emitting a string', async () => {
		const myEvent = event<string>();
		// const value = state(1)
		const destroy = myEvent.on((value) => {
			expect(value).toBeDefined()
			expect(value).toBe('test')
		})

		myEvent.emit('test')
		// console.log(myRoute.config)
		destroy()
		
	})
	test('Emitting a number', async () => {
		const myEvent = event<number>();
		const _value = state(1)
		const destroy = myEvent.on((value) => {
			expect(value).toBeDefined()
			_value.set(value)
		})

		myEvent.emit(4)
		
		expect(_value.value).toBe(4)
		setTimeout(() => {
		}, 100)
		destroy()
		// console.log(myRoute.config)
		
		
	})
	
})