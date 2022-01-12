const { state } = require('../dist/index');

test('can save a value', () => {
	const value = state(1)
	expect(value.value).toBe(1)
})

test('can change value and remember the old one', () => { 
	const value = state(1)
	value.set(2)
	expect(value.value).toBe(2)
	expect(value.lastValue).toBe(1)
});

test('can handle object deep merges', () => { 
	const s = state({ a: { a: 1, b: 2 }, b: 2 })
	s.set({ a: { b: 3 }});
	expect(s.value.a.b).toBe(3)
	expect(s.lastValue.a.b).toBe(2)
})