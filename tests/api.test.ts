import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { api, PlexusApi } from '@plexusjs/api'
import 'isomorphic-fetch'

// if(globalThis.fetch === undefined) globalThis.fetch = fetch as any as (input: RequestInfo, init?: RequestInit) => Promise<Response>;

let myApi: PlexusApi

beforeEach(() => {
	myApi = api()
})
describe('Testing Api Function', () => {
	test('Send a get request to google', async () => {
		// const value = state(1)
		myApi.setHeaders({
			custom: 'header',
		})
		console.log(myApi.config)
		// console.log(myApi.config)
		expect(myApi.config).toBeDefined()
		expect(myApi.config.headers).toBeDefined()
		expect(myApi.config.headers['custom']).toBe('header')

		const res = await myApi.get('https://google.com')
		expect(res?.status).toBeGreaterThan(0)
	})
	test('Set a onResponse', async () => {
		// const value = state(1)
		const apiUsingOnResponse = api('', {
			onResponse: (req, res) => {
				expect(res?.status).toBeGreaterThan(0)
				console.log('status: ', res?.status)
			},
		})
		apiUsingOnResponse.options({
			headers: {
				custom: 'header',
			},
		})
		// console.log(myApi.config)
		expect(apiUsingOnResponse.config).toBeDefined()
		expect(apiUsingOnResponse.config.headers).toBeDefined()
		expect(apiUsingOnResponse.config.headers['custom']).toBe('header')

		const res = await apiUsingOnResponse.get('https://google.com')
		expect(res?.status).toBeGreaterThan(0)
	})
	test('can throw an error', async () => {
		// const value = state(1)
		const apiUsingOnResponse = api('', {
			throws: true,
		})

		apiUsingOnResponse.options({
			headers: {
				custom: 'header',
			},
		})
		// console.log(myApi.config)
		expect(apiUsingOnResponse.config).toBeDefined()
		expect(apiUsingOnResponse.config.headers).toBeDefined()
		expect(apiUsingOnResponse.config.headers['custom']).toBe('header')

		await expect(
			apiUsingOnResponse.post('https://google.com/this/url/doesnt/exist')
		).rejects.toThrow()
	})
	test('can set a timeout', async () => {
		// const value = state(1)
		const apiUsingOnResponse = api('', {
			timeout: 100,
			throws: true,
		})

		apiUsingOnResponse.options({
			headers: {
				custom: 'header',
			},
		})
		// console.log(myApi.config)
		expect(apiUsingOnResponse.config).toBeDefined()
		expect(apiUsingOnResponse.config.headers).toBeDefined()
		expect(apiUsingOnResponse.config.headers['custom']).toBe('header')

		await expect(
			apiUsingOnResponse.post('https://google.com/this/url/doesnt/exist')
		).rejects.toThrow()
	})
})
describe("Test the API's baseURL capabilities", () => {
	const myApi2 = api('https://google.com').setHeaders({
		'Content-Type': 'application/json',
	})
	test('Can make a request to a sub-path', async () => {
		const res = await myApi2.post('maps')

		expect(myApi2.config.headers['Content-Type']).toBe('application/json')
		// console.log(JSON.stringify(res, null, 2))
		expect(res?.status).toBeGreaterThan(0)
	})
	test('test async setHeaders', async () => {
		const intendedValue = 'success'
		await myApi2.setHeaders(async () => {
			const headerValue = await new Promise((resolve) =>
				setTimeout(() => resolve(intendedValue), 100)
			)
			return {
				'Content-Type': 'application/json',
				'X-Test': headerValue,
			}
		})

		const res = await myApi2.post('maps')

		expect(myApi2.config.headers['X-Test']).toBe(intendedValue)
		// console.log(JSON.stringify(res, null, 2))
		expect(res?.status).toBeGreaterThan(0)
	})
})
