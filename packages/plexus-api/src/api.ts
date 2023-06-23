import { deepClone, deepMerge } from '@plexusjs/utils/dist/shared'
import {
	ApiStore,
	PlexusApiConfig,
	PlexusApiOptions,
	PlexusApiReq,
	PlexusApiRes,
} from './types'
// let's get Blob from Node.js or browser
let Blob
if (typeof window === 'undefined') {
	// If running in Node.js, import Blob from buffer package
	const { Blob: NodeBlob } = require('buffer')
	Blob = NodeBlob
} else {
	// If running in browser, use built-in Blob
	Blob = window.Blob
}

// Hoist Blob to top level
globalThis.Blob = Blob
// import { instance } from "./ "

export type PlexusApi = ApiInstance

const AuthTypes = ['bearer', 'basic', 'jwt'] as const
// type HeaderCache<CacheValue = Record<string, any>> =
// 	| [
// 			CacheValue | Promise<CacheValue> | undefined,
// 			(() => CacheValue | Promise<CacheValue> | undefined) | undefined
// 	  ]
// 	| []

/**
 * An API instance is used to make requests to a server. Interact with this by using `api()`
 */
export class ApiInstance {
	// private
	private _internalStore: ApiStore
	private _headers: Map<string, string> = new Map()
	private headerGetter: () =>
		| Record<string, any>
		| Promise<Record<string, any>> = () => ({})

	private waiting = false
	private waitingQueue: (() => void)[] = []
	constructor(
		baseURL: string = '',
		config: PlexusApiConfig = { defaultOptions: {} }
	) {
		this._internalStore = {
			_options: config.defaultOptions ?? {},
			_optionsInit: { ...config.defaultOptions },
			_timeout: config.timeout || undefined,
			_baseURL:
				baseURL.endsWith('/') && baseURL.length > 1
					? baseURL.substring(0, baseURL.length - 1)
					: baseURL,
			_noFetch: false,
			_authToken: '',
			_throws: config.throws ?? false,
			_silentFail: config.silentFail ?? false,
			onResponse: config.onResponse,
		}
		try {
			fetch
		} catch (e) {
			// instance().runtime.log("warn", "Fetch is not supported in this environment; api will not work.")
			console.warn(
				'Fetch is not supported in this environment; api will not work.'
			)
			this._internalStore._noFetch = true
		}
	}
	private async send<ResponseDataType>(
		path: string,
		options: {
			method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'
			body?: RequestInit['body']
		}
	): Promise<PlexusApiRes<ResponseDataType>> {
		// if we don't have fetch, return a blank response object
		if (this._internalStore._noFetch)
			return ApiInstance.createEmptyRes<ResponseDataType>()

		const headers = await this.headerGetter()

		if (!headers['Content-Type']) {
			if (options.body !== undefined) {
				headers['Content-Type'] = 'application/json'
			} else {
				headers['Content-Type'] = 'text/html'
			}
		}
		// init values used later
		let timedOut = false
		let res: Response | undefined
		try {
			// build out the URI
			const matches = path.match(/^http(s)?/g)
			const uri =
				matches && matches?.length > 0
					? path
					: `${this._internalStore._baseURL}${
							path.startsWith('/') || path?.length === 0 ? path : `/${path}`
					  }`
			const requestObject = {
				...this._internalStore._options,
				headers: headers,
				...options,
			}
			// if we have a timeout set, call fetch and set a timeout. If the fetch takes longer than the timeout length, kill thee request and return a blank response
			if (this._internalStore._timeout) {
				let to: any
				const timeout = new Promise<void>((resolve, reject) => {
					to = setTimeout(() => {
						timedOut = true
						resolve()
					}, this._internalStore._timeout)
				})
				const request = new Promise<Response>((resolve, reject) => {
					fetch(uri, requestObject)
						.then((response) => {
							clearTimeout(to)
							resolve(response)
						})
						.catch(reject)
				})

				// race the timeout and the request
				const raceResult = await Promise.race([timeout, request])

				if (raceResult) {
					res = raceResult
				} else {
					// if we're throwing, throw an error
					if (this._internalStore._throws) throw new Error('Request timed out')
					// a 504 response status means the programmatic timeout was surpassed
					return ApiInstance.createEmptyRes<ResponseDataType>(
						timedOut ? 504 : res?.status ?? 513
					)
				}
			}
			// if we don't have a timeout set, just try to fetch
			else {
				res = await fetch(uri, requestObject)
			}
		} catch (e) {
			// if silentFail is enabled, don't throw the error; Otherwise, throw an error
			if (!this._internalStore._silentFail) {
				throw e
			}
		}
		let data: ResponseDataType
		let rawData: string
		let blob: Blob
		// we never got a response
		if (res === undefined) {
			return ApiInstance.createEmptyRes<ResponseDataType>(500)
		}

		const hasCookie = (cName: string): boolean => {
			return res?.headers?.get('set-cookie')?.includes(cName) ?? false
		}
		const ok = res.status > 199 && res.status < 300

		// if we got a response, parse it and return it
		if (res.status >= 200 && res.status < 600) {
			const text = await res.text()
			let parsed: ResponseDataType = undefined as any
			try {
				parsed = JSON.parse(text || '{}') as ResponseDataType
			} catch (e) {}
			data = parsed ?? ({} as ResponseDataType)
			rawData = text
			blob = new Blob([text], { type: 'text/plain' })

			const pResponse = {
				status: res.status,
				response: res,
				rawData,
				blob,
				ok,
				data,
				hasCookie,
			}
			// if(this._internalStore.onResponse) this._internalStore.onResponse(req, pResponse)
			if (this._internalStore._throws && !ok) {
				throw pResponse
			}
			return pResponse
		}
		// if we got a response, but it's not in the 200 range, return it
		return {
			status: res.status,
			response: res,
			rawData: '',
			ok,
			data: {} as ResponseDataType,
			hasCookie,
		}
	}

	private async preSend<ResponseDataType>(
		path: string,
		options: {
			method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'
			body?: RequestInit['body']
		}
	) {
		const res = await this.send<ResponseDataType>(path, options)
		const headers = await this.headerGetter()
		this._internalStore.onResponse?.(
			{
				path,
				baseURL: this._internalStore._baseURL,
				options: this._internalStore._options,
				headers: headers,
				body: options.body,
				method: options.method,
			} as PlexusApiReq<typeof options.body>,
			res
		)
		return res
	}

	private static parseHeaders = (_headers: Map<string, string>) => {
		const headers: Record<string, string> = {}
		_headers.forEach((value, key) => {
			headers[key] = value
		})
		return headers
	}
	/**
	 * Set the configuration options for fetch
	 * @param {RequestInit} options  - Same as fetch options
	 * @param {boolean} overwrite (optional) If true, will overwrite the current options object
	 * @returns {this} The current instance
	 */
	options(options: RequestInit, overwrite: boolean): this
	options(options: RequestInit): this
	options(options: RequestInit, overwrite: boolean = false) {
		if (overwrite) {
			this._internalStore._options = deepClone(options) as RequestInit & {
				headers: Record<string, string>
			}
			return this
		}

		this._internalStore._options = deepMerge(
			this._internalStore._options,
			options
		) as RequestInit & { headers: Record<string, string> }

		options.headers && this.setHeaders(options.headers)
		return this
	}
	/**
	 * Send a get request
	 * @param {string} path The url to send the request to
	 * @param {Record<string, any>} query The url query to send
	 */
	get<ResponseType = any>(path: string, query?: Record<string, any>) {
		const params = new URLSearchParams(query)

		return this.preSend<ResponseType>(
			`${path}${params.toString().length > 0 ? `?${params.toString()}` : ''}`,
			{
				method: 'GET',
			}
		)
	}

	/**
	 * Send a post request
	 * @param {string} path The url to send the request to
	 * @param {Record<string, any> | string} body The body of the request (can be a string or object)
	 * @returns {Promise<PlexusApiRes<unknown>>} The response from the server
	 */
	async post<
		ResponseType = any,
		BodyType extends Record<string, any> | string = {}
	>(path: string, body: BodyType = {} as BodyType) {
		const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
		const options = {
			method: 'POST',
			bodyString,
		} as const
		const headers = await this.headerGetter()
		if (
			headers &&
			headers['Content-Type'] === 'application/x-www-form-urlencoded'
		) {
			const params = new URLSearchParams(bodyString)
			return this.preSend<ResponseType>(
				`${path}${params.toString().length > 0 ? `?${params.toString()}` : ''}`,
				options
			)
		} else {
			return this.preSend<ResponseType>(path, options)
		}
	}
	/**
	 * Send a put request
	 * @param {string} path The url to send the request to
	 * @param {Record<string, any> | string} body The body of the request (can be a string or object)
	 * @returns {Promise<PlexusApiRes<unknown>>} The response from the server
	 */
	put<ResponseType = any>(
		path: string,
		body: Record<string, any> | string = {}
	) {
		if (typeof body !== 'string') {
			body = JSON.stringify(body)
		}
		return this.preSend<ResponseType>(path, {
			method: 'PUT',
			body,
		})
	}
	/**
	 * Send a delete request
	 * @param {string} path The url to send the request to
	 * @returns {Promise<PlexusApiRes<unknown>>} The response from the server
	 */
	delete<ResponseType = any>(path: string) {
		return this.preSend<ResponseType>(path, {
			method: 'DELETE',
			body: JSON.stringify({}),
		})
	}
	/**
	 * Send a patch request
	 * @param {string} path The url to send the request to
	 * @param {Record<string, any> | string} body The body of the request (can be a string or object)
	 * @returns {Promise<PlexusApiRes<unknown>>} The response from the server
	 */
	patch<ResponseType = any>(
		path: string,
		body: Record<string, any> | string = {}
	) {
		if (typeof body !== 'string') {
			body = JSON.stringify(body)
		}
		return this.preSend<ResponseType>(path, {
			method: 'PATCH',
			body,
		})
	}
	/**
	 * Send a graphql request
	 * @param {string} query The gql query to send
	 * @param {Record<string, any>} variables Variables
	 * @returns {Promise<PlexusApiRes<unknown>>} The response from the server
	 */
	gql<ResponseType = any>(query: string, variables?: Record<string, any>) {
		this._headers.set('Content-Type', 'application/json')

		return this.preSend<ResponseType>('', {
			method: 'POST',
			body: JSON.stringify({
				query,
				variables,
			}),
		})
	}
	/**
	 * Set the authentication details for the request
	 * @param {'bearer' | 'basic' | 'jwt'} type optional - The type of authentication to use. This determines what prefix to use for the header
	 * @param {string} token The token to use for authentication
	 * @returns {this} The current instance
	 */
	auth(type: typeof AuthTypes[number], token: string): this
	auth(token: string): this
	auth(
		typeOrToken: typeof AuthTypes[number] | string = 'bearer',
		token?: string
	) {
		if (!token) {
			if (AuthTypes.includes(typeOrToken as any)) {
				return this
			}
			token = typeOrToken as string
		}
		if (typeOrToken === token) {
			typeOrToken = 'bearer'
		}
		if (!token || !typeOrToken) return this
		token = token
			.replace(/^(B|b)earer /, '')
			.replace(/^(B|b)asic /, '')
			.replace(/^(JWT|jwt) /, '')

		this._internalStore._authToken = token
		const prefix =
			typeOrToken === 'jwt' ? 'JWT ' : typeOrToken === 'bearer' ? 'Bearer ' : ''
		this._headers.set('Authorization', `${prefix}${token}`)
		return this
	}

	/**
	 * Set headers for the request
	 * @callback HeaderFunction () => Record<string, any> | Promise<Record<string, any>> - A function that returns the headers to set for the request
	 * @param {HeaderFunction | Record<string, any>} headers The headers to set for the request
	 * @returns {this | Promise<this>} The current instance
	 */
	setHeaders<HeaderFunction extends () => Record<string, any>>(
		inputFnOrObj: Record<string, any>
	): this
	setHeaders<
		HeaderFunction extends () =>
			| Record<string, any>
			| Promise<Record<string, any>>
	>(inputFnOrObj: HeaderFunction | Record<string, any>) {
		// if (!_headers) _internalStore._options.headers = {}
		if (this._internalStore._noFetch) return this
		if (!inputFnOrObj) return this

		// if the headers are a promise, wait for it to resolve
		const formatHeaders = <HeaderType extends Record<string, any>>(
			headers: HeaderType
		) => {
			const formattedHeaders: Record<string, any> = {}
			Array.from(this._headers.entries()).map(([key, value]) => {
				// uppercase the dash separated tokens
				formattedHeaders[
					key
						.split('-')
						.map((v) => `${v?.at?.(0)}${v?.substring?.(1)}`)
						.join('-')
						.replace(' ', '-')
				] = value
			})
			this.waiting = false
			Object.entries(headers || {}).map(([key, value]) => {
				// uppercase the dash separated tokens
				formattedHeaders[
					key
						.split('-')
						.map((v) => `${v?.at?.(0)}${v?.substring?.(1)}`)
						.join('-')
						.replace(' ', '-')
				] = value
			})
			this._headers.clear()
			Object.entries(formattedHeaders).forEach((kvPair) => {
				this._headers.set(kvPair[0], kvPair[1])
			})
			return formattedHeaders
		}

		if (typeof inputFnOrObj === 'object') {
			// if the headers are a function, set it to the header getter
			this.headerGetter = () => formatHeaders(inputFnOrObj)
			this.headerGetter()
			return this
		}
		this.headerGetter = async () => formatHeaders(await inputFnOrObj())
		this.headerGetter()
		return this
	}

	/**
	 * Get the headers for the request
	 * @returns {Record<string, string>} The headers for the request
	 */
	get headers(): Record<string, string> {
		return ApiInstance.parseHeaders(this._headers)
	}

	/**
	 * Reset this routes configuration
	 * @returns {this} The current instance
	 */
	reset() {
		this._internalStore._options =
			deepClone(this._internalStore._optionsInit) || {}
		return this
	}
	/**
	 * The configuration of this api
	 * @returns {Record<string, any>} The configuration of this api
	 */
	get config() {
		return Object.freeze(
			deepClone({
				...this._internalStore._options,
				headers: ApiInstance.parseHeaders(this._headers),
			})
		) as {
			headers: Record<string, string>
		} & RequestInit
	}
	private static createEmptyRes<ResponseDataType = any>(status: number = 408) {
		return {
			status,
			response: {} as Response,
			rawData: '',
			data: {} as ResponseDataType,
			ok: status > 199 && status < 300,
			hasCookie: (name: string) => false,
		}
	}
}

export function api(
	baseURL: string = '',
	config: PlexusApiConfig = { defaultOptions: {} }
) {
	return new ApiInstance(baseURL, config)
}
