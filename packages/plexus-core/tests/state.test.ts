const {state} = require('../dist/index')

test('can save a value', () => {
	const value = state(1)
	expect(value.value).toBe(1)
})

test('can change value and remember the old one', () =>{ 
	const value = state(1)
	value.set(2)
	expect(value.value).toBe(2)
	expect(value.lastValue).toBe(1)
})