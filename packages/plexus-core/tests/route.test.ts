import { route, PlexusRoute } from '../src'
import { _instance } from '../src/instance';
import { PxState, PxStateInstance } from '../src/interfaces';
let myRoute: PlexusRoute


beforeEach(() => {
	myRoute = route();
})
describe('Testing Route Function', () => {
	test('Senmd a get request to google', async () => {

		// const value = state(1)
		myRoute.options({
			headers: {
				custom: 'header'
			}
		})
		// console.log(myRoute.config)
		expect(myRoute.config).toBeDefined()
		expect(myRoute.config.headers).toBeDefined()
		expect(myRoute.config.headers['custom']).toBe('header')
		const res = await myRoute.get('https://google.com')
		if(res){
			// we have access to fetch
			expect(res).toBeDefined()
		}
	})
	
	
})