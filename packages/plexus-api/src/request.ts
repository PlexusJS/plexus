import { PlexusError } from '@plexusjs/utils'
import { ApiInstance } from './api'
import { PlexusApiConfig, PlexusApiRes, PlexusApiSendOptions } from './types'

export class ApiRequest {
	private attempts = 0
	constructor(
		public api: ApiInstance,
		public path: string,
		public config: Partial<{ requestOptions: PlexusApiSendOptions }> &
			PlexusApiConfig
	) {}

	private retry<ResponseDataType>(path: string, options: PlexusApiSendOptions) {
		if (this.config.retry) {
			if (this.attempts < this.config.retry) {
				this.attempts++
				return this.send<ResponseDataType>(path, options)
			}
		}
	}
	/**
	 * Send a request to the server
	 * @param path
	 * @param options
	 */
	async send<ResponseDataType>(
		path: string,
		options: PlexusApiSendOptions
	): Promise<PlexusApiRes<ResponseDataType>> {
		const instanceHeaders = this.api.headers

		const headers = {
			...instanceHeaders,
			...(options.headers ?? {}),
		}

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
					: `${this.api.config.baseURL}${
							path.startsWith('/') || path?.length === 0 ? path : `/${path}`
					  }`

			const controller = new AbortController()
			const requestObject = {
				...this.api.config.options,
				...options,
				headers,
				signal: controller.signal,
			}
			// if we have a timeout set, call fetch and set a timeout. If the fetch takes longer than the timeout length, kill thee request and return a blank response
			if (this.config.timeout) {
				let to: any
				const timeout = new Promise<void>((resolve, reject) => {
					to = setTimeout(() => {
						timedOut = true
						resolve()
					}, this.config.timeout)
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
					if (this.config.abortOnTimeout) controller.abort()

					// if we're throwing, throw an error
					if (this.config.throws)
						throw new PlexusError('Request timed out', { type: 'api' })
					// a 504 response status means the programmatic timeout was surpassed
					return ApiRequest.createEmptyRes<ResponseDataType>(
						timedOut ? 504 : res?.status ?? 513
					)
				}
			}
			// if we don't have a timeout set, just try to fetch
			else {
				res = await fetch(uri, requestObject)
			}
		} catch (e) {
			this.retry(path, options)
			// if silentFail is enabled, don't throw the error; Otherwise, throw an error
			if (!this.config.throws) {
				throw e
			}
		}
		let data: ResponseDataType
		let rawData: string
		let blob: Blob
		// we never got a response
		if (res === undefined) {
			return ApiRequest.createEmptyRes<ResponseDataType>(500)
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
			if (this.config.throws && !ok) {
				throw pResponse
			}
			return pResponse
		}
		// if we got a response, but it's not in the 200~600 range, return it
		return {
			status: res.status,
			response: res,
			rawData: '',
			ok,
			data: {} as ResponseDataType,
			hasCookie,
		}
	}

	static createEmptyRes<ResponseDataType = any>(status: number = 408) {
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
