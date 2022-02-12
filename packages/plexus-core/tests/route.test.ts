import { api, PlexusApi } from '../src'
import fetch from 'node-fetch';

if(globalThis.fetch === undefined) globalThis.fetch = fetch as any as (input: RequestInfo, init?: RequestInit) => Promise<Response>;

let myApi: PlexusApi


beforeEach(() => {
	myApi = api();
})
describe('Testing Api Function', () => {
	test('Senmd a get request to google', async () => {

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
		const res = await myApi.get('https://google.com')
		if(res){
			// we have access to fetch
			expect(res).toBeDefined()
		}
	})
	
	
})