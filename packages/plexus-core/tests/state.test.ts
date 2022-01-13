import { state } from '../src'
import { _instance } from '../src/instance';
import { PxState, PxStateInstance } from '../src/interfaces';
let booleanState: PxStateInstance<boolean>,
 stringState: PxStateInstance<string>,
 objectState: PxStateInstance<{ a?: Partial<{ a: boolean, b: boolean }>, b?: boolean, c?: {b?: boolean}}>,
 arrayState: PxStateInstance<{ item?: string, item2?: {subitem?: string}}[]>,
 nullState: PxStateInstance<null | boolean>

const initialValue = {
	boolean: true,
	string: 'Hello Pulse!',
	object: { a: { a: true, b: true }, b: true },
	array: [{ item: 'Hello', item2: { subitem: 'World' } }, { item: 'Goodbye', item2: { subitem: 'People' } }],
	null: null
}

beforeEach(() => {
	booleanState = state(initialValue.boolean);
	stringState = state(initialValue.string);
	objectState = state<{ a?: { a?: boolean, b?: boolean }, b?: boolean, c?: {b?: boolean}}>(initialValue.object);
	arrayState = state<{ item?: string, item2?: {subitem?: string}}[]>(initialValue.array);
	nullState = state(initialValue.null);
})
describe('Testing State Function', () => {
	test('can save a value', () => {
		const value = state(1)
		expect(value.value).toBe(1)
	})
	
	test('Change value and remember the old one', () => { 
		const value = state(1)
		value.set(2)
		expect(value.value).toBe(2)
		expect(value.lastValue).toBe(1)
	});
	
	test('Checking state().set()', () => { 
		// check .set(value: object)
		objectState.set({ a: { b: false }});
		// check if the object is actually merged and children props do get overwritten
		expect(objectState.value.a.b).toBe(false)
		
		
	})

	test('Checking state().patch()', () => {
		// can the object deep merge?
		objectState.patch({ a: { b: false }});
		expect(objectState.value.a.a).toBe(true)
		// check that other value is still there
		expect(objectState.value.b).toBe(true)
		// changed intended value
		expect(objectState.value.a.b).toBe(false)
		

		// check array deep merge
		arrayState.patch([{ item: 'Hello' }]);
		expect(arrayState.value[0].item).toBe('Hello')
		expect(arrayState.value[0].item2).toStrictEqual({ subitem: 'World' })
		expect(arrayState.value[1].item).toBe('Goodbye')

	})

	test('Checking state.watch()', () => {
		let callbackCalled = false;
		const callback = () => {
			// console.log('callback called', stringState.watchers)
			callbackCalled = !callbackCalled;
		}
		// can add watcher
		const watcherKey = stringState.watch(callback);
		stringState.set('Hello World');
		expect(callbackCalled).toBe(true);
		// console.log(_instance()._runtime.getWatchers())
		// can remove watcher
		stringState.removeWatcher(watcherKey);
		// console.log(_instance()._runtime.getWatchers())
		stringState.set('new value');
		expect(callbackCalled).toBe(true);
		
		
	})
})