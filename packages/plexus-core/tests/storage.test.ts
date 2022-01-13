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
describe('Testing Storage Function', () => {
	test('Default Storage is created and assigned', () => {

		const value = state(1)
		expect(_instance().storageEngine).toBe('default')
		expect(_instance().storage).toBeDefined()
	})
	
	
})