import { deepClone, deepMerge } from "./helpers"
import { instance } from "./instance"
export interface PlexusApiConfig {
	options?: RequestInit
	timeout?: number
	silentFail?: boolean
}
export interface PlexusApiRes<DataType = any> {
	status: number
	response: ResponseInit
	rawData: any
	data: DataType
}
export interface PlexusApi {
	/**
	 * Set the configurtation options for fetch
	 * @param options RequestInit - Same as fetch options
	 * @param overwrite (optional) If true, will overwrite the current options object
	 */
	options(options: RequestInit, overwrite: boolean): PlexusApi
	options(options: RequestInit): PlexusApi
	/**
	 * Send a get request
	 * @param url The url to send the request to
	 */
	get<ResponseType = any>(url: string): Promise<PlexusApiRes<ResponseType>>
	/**
	 * Send a post request
	 * @param url The url to send the request to
	 * @param body The body of the request (can be a string or object)
	 */
	post<ResponseType = any>(url: string, body?: Record<string, any> | string): Promise<PlexusApiRes<ResponseType>>
	/**
	 * Send a put request
	 * @param url The url to send the request to
	 * @param body The body of the request (can be a string or object)
	 */
	put<ResponseType = any>(url: string, body?: Record<string, any> | string): Promise<PlexusApiRes<ResponseType>>
	/**
	 * Send a delete request
	 * @param url The url to send the request to
	 */
	delete<ResponseType = any>(url: string): Promise<PlexusApiRes<ResponseType>>
	/**
	 * Send a patch request
	 * @param url The url to send the request to
	 * @param body The body of the request (can be a string or object)
	 */
	patch<ResponseType = any>(url: string, body?: Record<string, any> | string): Promise<PlexusApiRes<ResponseType>>
	/**
	 * Send a graphql request
	 * @param query The gql query to send
	 * @param variables Variables
	 */
	gql<ResponseType = any>(query: string, variables?: Record<string, any>): Promise<PlexusApiRes<ResponseType>>
	/**
	 * Set headers for the request
	 * @param headers The headers to set for the request
	 */
	headers(headers: Record<string, any>): PlexusApi
	/**
	 * Reset this routes configuration
	 */
	reset(): PlexusApi
	/**
	 * Set the authentication details for the request
	 * @param token The token to use for authentication
	 * @param type optional - The type of authentication to use. This determines what prefix to use for the header
	 */
	auth(token: string | undefined, type?: "bearer" | "basic" | "jwt"): PlexusApi
	/**
	 * The configuration of this api
	 */
	config: RequestInit
}
export function api(baseURL: string = "", config: PlexusApiConfig = { options: { headers: {} } }): PlexusApi {
	const _internalStore = {
		_options: deepClone(config.options),
		_timeout: config.timeout || undefined,
		_baseURL: baseURL.endsWith("/") && baseURL.length > 1 ? baseURL.substring(0, baseURL.length - 1) : baseURL,
		_noFetch: false,
		_authToken: "",
	}
	async function send<ResponseDataType>(path: string): Promise<PlexusApiRes<ResponseDataType>> {
		// default url to baseurl
		let finalUrl = `${path}`
		if (_internalStore._noFetch) return { status: 408, response: {}, rawData: {}, data: null }

		if (_internalStore._baseURL.length > 0) {
			finalUrl = `${_internalStore._baseURL}${path.startsWith("/") ? path : `/${path}`}`
		}
		if (_internalStore._options.method === undefined) {
			_internalStore._options.method = "GET"
		}
		if (_internalStore._options.headers["Content-Type"] === undefined) {
			if (_internalStore._options.body !== undefined) {
				_internalStore._options.headers["Content-Type"] = "application/json"
			} else {
				_internalStore._options.headers["Content-Type"] = "text/html"
			}
		}
		console.log(_internalStore._options.headers, _internalStore._options.method)
		let timedOut = false
		let res: Response | undefined
		try {
			if (_internalStore._timeout && _internalStore._timeout > 0) {
				// res = await
				let to: any
				const timeout = new Promise<void>((resolve, reject) => {
					to = setTimeout(() => {
						timedOut = true
						resolve()
					}, _internalStore._timeout)
				})
				const request = new Promise<Response>((resolve, reject) => {
					fetch(`${path.match(/^http(s)?/g)?.length > 0 ? path : finalUrl}`, _internalStore._options)
						.then((response) => {
							clearTimeout(to)
							resolve(response)
						})
						.catch(reject)
				})
				const raceResult = await Promise.race([timeout, request])
				if (raceResult) {
					res = raceResult
				} else {
					// a -1 response status means the programmatic timeout was surpassed
					return { status: timedOut ? 504 : res?.status ?? 513, response: {}, rawData: {}, data: null }
				}
			} else {
				res = await fetch(`${path.match(/^http(s)?/g)?.length > 0 ? path : finalUrl}`, _internalStore._options)
			}
		} catch (e) {}
		let data: ResponseDataType
		let rawData: ResponseDataType

		if (res === undefined) {
			return {
				status: 500,
				response: {},
				rawData: null,
				data,
			}
		}

		if (res.status >= 200 && res.status < 400) {
			if (
				_internalStore._options.headers["Content-Type"] === "application/json" ||
				_internalStore._options.headers["Content-Type"] === "application/x-www-form-urlencoded"
			) {
				data = (await res.json()) as ResponseDataType
			} else {
				rawData = (await res.text()) as any as ResponseDataType
			}

			return {
				status: res.status,
				response: res,
				rawData,
				data,
			}
		} else {
			return {
				status: res.status,
				response: res,
				rawData,
				data,
			}
		}
	}

	try {
		if (fetch) {
		}
	} catch (e) {
		instance()._runtime.log("warn", "Fetch is not supported in this environment; api will not work.")
		_internalStore._noFetch = true
	}

	return Object.freeze({
		options: function (options?: RequestInit, overwrite: boolean = false) {
			if (overwrite) {
				_internalStore._options = deepClone(options)
				return this as PlexusApi
			}

			// if(!options && !overwrite) return deepClone(_internalStore._options)

			_internalStore._options = deepMerge(_internalStore._options, options)
			this.headers()
			return this as PlexusApi
			if (_internalStore._noFetch) return this
		},
		get(path: string, query?: Record<string, any>) {
			if (_internalStore._noFetch) return null
			_internalStore._options.method = "GET"
			const params = new URLSearchParams(query)

			return send<ResponseType>(`${path}${params.toString().length > 0 ? `?${params.toString()}` : ""}`)
		},
		post(path: string, body: Record<string, any> | string = {}) {
			if (_internalStore._noFetch) return null
			_internalStore._options.method = "POST"
			if (typeof body !== "string") {
				body = JSON.stringify(body)
			}
			_internalStore._options.body = body
			if (_internalStore._options.headers["Content-Type"] === "application/x-www-form-urlencoded") {
				const params = new URLSearchParams(body)
				return send<ResponseType>(`${path}${params.toString().length > 0 ? `?${params.toString()}` : ""}`)
			} else {
				return send<ResponseType>(path)
			}
		},
		put(path: string, body: Record<string, any> | string = {}) {
			if (_internalStore._noFetch) return null
			_internalStore._options.method = "PUT"
			if (typeof body !== "string") {
				_internalStore._options.body = JSON.stringify(body)
			}
			return send<ResponseType>(path)
		},
		delete(path: string) {
			if (_internalStore._noFetch) return null
			_internalStore._options.method = "DELETE"
			return send<ResponseType>(path)
		},
		patch(path: string, body: Record<string, any> | string = {}) {
			if (_internalStore._noFetch) return null
			_internalStore._options.method = "PATCH"
			if (typeof body !== "string") {
				_internalStore._options.body = JSON.stringify(body)
			}
			return send<ResponseType>(path)
		},
		gql(query: string, variables?: Record<string, any>) {
			if (_internalStore._noFetch) return null
			_internalStore._options.method = "POST"
			_internalStore._options.body = JSON.stringify({
				query,
				variables,
			})

			_internalStore._options.headers["Content-Type"] = "application/json"

			return send<ResponseType>("")
		},
		auth(token: string | undefined, type: "bearer" | "basic" | "jwt" = "bearer") {
			if (!token) return this
			token = token.replace(/^(B|b)earer /, "").replace(/^(B|b)asic /, "").replace(/^(JWT|jwt) /, "")
			_internalStore._authToken = token
			const prefix = type === "jwt" ? "JWT " : type === "bearer" ? "Bearer " : ""
			_internalStore._options.headers["Authorization"] = `${prefix}${token}`
			return this
		},
		headers(headers?: Record<string, any>) {
			if (!_internalStore._options.headers) _internalStore._options.headers = {} as HeadersInit
			if (_internalStore._noFetch) return this as PlexusApi
			const temp: Record<string, any> = {}
			Object.entries(headers || _internalStore._options.headers).map(([key, value]) => {
				// uppercase the dash separated tokens
				temp[
					key
						.split("-")
						.map((v) => `${v.at(0)}${v.substring(1)}`)
						.join("-")
				] = value
			})
			_internalStore._options.headers = temp
			return this as PlexusApi
		},
		reset() {
			_internalStore._options = deepClone(config.options)
			return this as PlexusApi
		},
		get config() {
			return deepClone(_internalStore._options || {})
		},
	}) as PlexusApi
}
