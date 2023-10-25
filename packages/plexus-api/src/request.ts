import { PlexusError } from '@plexusjs/utils'
import { ApiInstance } from './api'
import {
	PlexusApiConfig,
	PlexusApiReq,
	PlexusApiRes,
	PlexusApiSendOptions,
} from './types'
import { uuid } from './utils'

export class ApiRequest {
	private attempts = 0
	private controllerMap: Map<string, AbortController> = new Map()
	constructor(
		public api: ApiInstance,
		public path: string,
		public config: PlexusApiConfig
	) {}

	public getRequestSchema<BodyType>(
		method: PlexusApiReq['method'],
		payload?: {
			body?: BodyType
			path?: string
		}
	) {
		const body = payload?.body ?? ({} as BodyType)
		return {
			path: this.path,
			baseURL: this.api.config.baseURL,
			options: this.api.config.options,
			headers: this.config.headers,
			body,
			method,
		} as PlexusApiReq<BodyType>
	}

	/**
	 * Retry a request
	 * @param path The path to send the request to
	 * @param options	The options to send with the request
	 * @returns undefined if the request can't be retried, otherwise a pending response
	 */
	private async retry<ResponseDataType>(
		path: string,
		options: PlexusApiSendOptions
	) {
		if (!!this.config.retry) {
			console.log('retrying', this.attempts, this.config.retry)
			if (this.attempts < this.config.retry) {
				return false
				this.attempts++
				this.config.onRetry?.(
					this.attempts,
					this.getRequestSchema(options.method, {
						body: options.body,
					})
				)
				return await this.send<ResponseDataType>(path, options)
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
		const requestId = uuid()
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

			// create a new abort controller and add it to the controller map
			const controller = new AbortController()
			const requestObject = {
				...this.api.config.options,
				...options,
				headers,
				signal: controller.signal,
			}
			this.controllerMap.set(requestId, controller)

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
					// abort the request
					if (this.config.abortOnTimeout) controller.abort()

					// if retry returns something (which means it's retrying), return it
					const retrying = await this.retry<ResponseDataType>(path, options)
					if (!!this.config.retry && retrying) return retrying

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
			// if retry returns something (which means it's retrying), return it
			const retrying = await this.retry<ResponseDataType>(path, options)
			if (!!this.config.retry && retrying) return retrying
			// if silentFail is enabled, don't throw the error; Otherwise, throw an error
			if (!this.config.throws) {
				throw e
			}
		}
		// we're successful, reset the retry counter
		this.attempts = 0

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
