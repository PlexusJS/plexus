import { api, PlexusApi } from '../src'
import 'isomorphic-fetch';

// if(globalThis.fetch === undefined) globalThis.fetch = fetch as any as (input: RequestInfo, init?: RequestInit) => Promise<Response>;

let myApi: PlexusApi


beforeEach(() => {
	myApi = api();
})
describe('Testing Api Function', () => {
	test('Send a get request to google', async () => {

		// const value = state(1)
		myApi.options({
			headers: {
				custom: 'header'
			}
		})
		// console.log(myApi.config)
		expect(myApi.config).toBeDefined()
		expect(myApi.config.headers).toBeDefined()
		expect(myApi.config.headers['custom']).toBe('header')
		const res = await myApi.get('https://google.com');
		expect(res?.status).toBeGreaterThan(0)
	})

	describe('Test the API\'s baseURL capabilities', () => {
		const myApi2 = api('https://google.com');
		test('Can make a request to a sub-path', async () => {
			const res = await myApi2.get('maps');
			expect(res?.status).toBeGreaterThan(0)
		})
	})
	
	
})