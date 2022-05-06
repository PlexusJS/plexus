import { deepClone, deepMerge } from "./helpers"
import { instance } from "./instance"
export interface PlexusApiConfig {
	defaultOptions?: PlexusAPIReq
	timeout?: number
	silentFail?: boolean
}
export interface PlexusApiRes<DataType = any> {
	status: number
	response: ResponseInit
	rawData: string
	data: DataType
	ok: boolean
}
export interface PlexusAPIReq {
	cache?: RequestInit["cache"]
	credentials?: RequestInit["credentials"]
	integrity?: RequestInit["integrity"]
	keepalive?: RequestInit["keepalive"]
	mode?: RequestInit["mode"]
	redirect?: RequestInit["redirect"]
	referrer?: RequestInit["referrer"]
	signal?: RequestInit["signal"]
	window?: RequestInit["window"]
}

export type PlexusApi = ApiInstance
interface ApiStore {
	_options: PlexusAPIReq
	_optionsInit: PlexusAPIReq
	_timeout: number | undefined
	_baseURL: string
	_noFetch: boolean
	_authToken: string
	_silentFail: boolean
}
/**
 *
 */
export class ApiInstance {
	// private
	private _internalStore: ApiStore
	private _headers: Map<string, string> = new Map()
	constructor(baseURL: string = "", config: PlexusApiConfig = { defaultOptions: {} }) {
		this._internalStore = {
			_options: config.defaultOptions ?? {},
			_optionsInit: { ...config.defaultOptions },
			_timeout: config.timeout || undefined,
			_baseURL: baseURL.endsWith("/") && baseURL.length > 1 ? baseURL.substring(0, baseURL.length - 1) : baseURL,
			_noFetch: false,
			_authToken: "",
			_silentFail: config.silentFail || false,
		}
		try {
			fetch
		} catch (e) {
			instance().runtime.log("warn", "Fetch is not supported in this environment; api will not work.")
			this._internalStore._noFetch = true
		}
	}
	private async send<ResponseDataType>(
		path: string,
		options: {
			method: RequestInit["method"]
			body?: RequestInit["body"]
		}
	): Promise<PlexusApiRes<ResponseDataType>> {
		// if we don't have fetch, return a blank response object
		if (this._internalStore._noFetch) return ApiInstance.createEmptyRes<ResponseDataType>()

		//
		if (!this._headers.has("Content-Type")) {
			if (options.body !== undefined) {
				this._headers.set("Content-Type", "application/json")
			} else {
				this._headers.set("Content-Type", "text/html")
			}
		}
		// init values used later
		let timedOut = false
		let res: Response | undefined
		try {
			// build out the URI
			const matches = path.match(/^http(s)?/g)
			const uri = matches && matches?.length > 0 ? path : `${this._internalStore._baseURL}${path.startsWith("/") ? path : `/${path}`}`
			const requestObject = { ...this._internalStore._options, headers: ApiInstance.parseHeaders(this._headers), ...options }
			// if we have a timeout set
			if (this._internalStore._timeout) {
				// res = await
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
				const raceResult = await Promise.race([timeout, request])
				if (raceResult) {
					res = raceResult
				} else {
					// a 504 response status means the programmatic timeout was surpassed
					return ApiInstance.createEmptyRes<ResponseDataType>(timedOut ? 504 : res?.status ?? 513)
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
		// we never got a response
		if (res === undefined) {
			return ApiInstance.createEmptyRes<ResponseDataType>(500)
		}

		if (res.status >= 200 && res.status < 600) {
			const text = await res.text()
			let parsed: ResponseDataType = undefined as any
			try {
				parsed = JSON.parse(text) as ResponseDataType
			} catch (e) {}
			data = parsed ?? ({} as ResponseDataType)
			rawData = text

			return {
				status: res.status,
				response: res,
				rawData,
				ok: res.status > 199 && res.status < 300,
				data,
			}
		} else {
			return {
				status: res.status,
				response: res,
				rawData: "",
				ok: res.status > 199 && res.status < 300,
				data: {} as ResponseDataType,
			}
		}
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
	 * @param options RequestInit - Same as fetch options
	 * @param overwrite (optional) If true, will overwrite the current options object
	 */
	options(options: RequestInit, overwrite: boolean)
	options(options: RequestInit)
	options(options: RequestInit, overwrite: boolean = false) {
		if (overwrite) {
			this._internalStore._options = deepClone(options) as RequestInit & { headers: Record<string, string> }
			return this
		}

		this._internalStore._options = deepMerge(this._internalStore._options, options) as RequestInit & { headers: Record<string, string> }

		this.headers(options.headers)
		return this
	}
	/**
	 * Send a get request
	 * @param url The url to send the request to
	 * @param query The url query to send
	 */
	get<ResponseType = any>(path: string, query?: Record<string, any>) {
		const params = new URLSearchParams(query)

		return this.send<ResponseType>(`${path}${params.toString().length > 0 ? `?${params.toString()}` : ""}`, {
			method: "GET",
		})
	}
	/**
	 * Send a post request
	 * @param url The url to send the request to
	 * @param body The body of the request (can be a string or object)
	 */
	post<ResponseType = any>(path: string, body: Record<string, any> | string = {}) {
		if (typeof body !== "string") {
			body = JSON.stringify(body)
		}
		const options = {
			method: "POST",
			body,
		}
		if (this._headers && this._headers.get("Content-Type") === "application/x-www-form-urlencoded") {
			const params = new URLSearchParams(body)
			return this.send<ResponseType>(`${path}${params.toString().length > 0 ? `?${params.toString()}` : ""}`, options)
		} else {
			return this.send<ResponseType>(path, options)
		}
	}
	/**
	 * Send a put request
	 * @param url The url to send the request to
	 * @param body The body of the request (can be a string or object)
	 */
	put<ResponseType = any>(path: string, body: Record<string, any> | string = {}) {
		if (typeof body !== "string") {
			body = JSON.stringify(body)
		}
		return this.send<ResponseType>(path, {
			method: "PUT",
			body,
		})
	}
	/**
	 * Send a delete request
	 * @param url The url to send the request to
	 */
	delete<ResponseType = any>(path: string) {
		return this.send<ResponseType>(path, {
			method: "DELETE",
		})
	}
	/**
	 * Send a patch request
	 * @param url The url to send the request to
	 * @param body The body of the request (can be a string or object)
	 */
	patch<ResponseType = any>(path: string, body: Record<string, any> | string = {}) {
		if (typeof body !== "string") {
			body = JSON.stringify(body)
		}
		return this.send<ResponseType>(path, {
			method: "PATCH",
			body,
		})
	}
	/**
	 * Send a graphql request
	 * @param query The gql query to send
	 * @param variables Variables
	 */
	gql<ResponseType = any>(query: string, variables?: Record<string, any>) {
		this._headers.set("Content-Type", "application/json")

		return this.send<ResponseType>("", {
			method: "POST",
			body: JSON.stringify({
				query,
				variables,
			}),
		})
	}
	/**
	 * Set the authentication details for the request
	 * @param token The token to use for authentication
	 * @param type optional - The type of authentication to use. This determines what prefix to use for the header
	 */
	auth(token: string | undefined, type: "bearer" | "basic" | "jwt" = "bearer") {
		if (!token) return this
		token = token
			.replace(/^(B|b)earer /, "")
			.replace(/^(B|b)asic /, "")
			.replace(/^(JWT|jwt) /, "")
		this._internalStore._authToken = token
		const prefix = type === "jwt" ? "JWT " : type === "bearer" ? "Bearer " : ""
		this._headers.set("Authorization", `${prefix}${token}`)
		return this
	}
	/**
	 * Set headers for the request
	 * @param headers The headers to set for the request
	 */
	headers(headers?: Record<string, any>) {
		// if (!_headers) _internalStore._options.headers = {}
		if (this._internalStore._noFetch) return this
		const temp: Record<string, any> = {}
		Array.from(this._headers.entries()).map(([key, value]) => {
			// uppercase the dash separated tokens
			temp[
				key
					.split("-")
					.map((v) => `${v.at(0)}${v.substring(1)}`)
					.join("-")
			] = value
		})
		Object.entries(headers || {}).map(([key, value]) => {
			// uppercase the dash separated tokens
			temp[
				key
					.split("-")
					.map((v) => `${v.at(0)}${v.substring(1)}`)
					.join("-")
			] = value
		})
		this._headers.clear()
		Object.entries(temp).forEach((kvPair) => {
			this._headers.set(kvPair[0], kvPair[1])
		})
		return this
	}
	/**
	 * Reset this routes configuration
	 */
	reset() {
		this._internalStore._options = deepClone(this._internalStore._optionsInit) || {}
		return this
	}
	/**
	 * The configuration of this api
	 */
	get config() {
		return Object.freeze(deepClone({ ...this._internalStore._options, headers: ApiInstance.parseHeaders(this._headers) })) as {
			headers: Record<string, string>
		} & RequestInit
	}
	private static createEmptyRes<ResponseDataType = any>(status: number = 408) {
		return { status, response: {}, rawData: "", data: {} as ResponseDataType, ok: status > 199 && status < 300 }
	}
}

export function api(baseURL: string = "", config: PlexusApiConfig = { defaultOptions: {} }) {
	return new ApiInstance(baseURL, config)
}
