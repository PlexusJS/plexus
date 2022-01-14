import { deepClone, deepMerge } from "./helpers"
import { instance } from "./instance"
export interface PlexusRouteConfig {
	options?: RequestInit
}
export interface PlexusRouteRes<DataType=any> {
	status: number,
	response: ResponseInit,
	rawData: any,
	data: DataType
}
export interface PlexusRoute {
	options(options: RequestInit, overwrite: boolean): PlexusRoute
	options(options: RequestInit): PlexusRoute
	get<ResponseType=any>(url: string): Promise<PlexusRouteRes<ResponseType>>
	post<ResponseType=any>(url: string, body: Record<string, string>): Promise<PlexusRouteRes<ResponseType>>
	put<ResponseType=any>(url: string, body: Record<string, string>): Promise<PlexusRouteRes<ResponseType>>
	delete<ResponseType=any>(url: string): Promise<PlexusRouteRes<ResponseType>>
	patch<ResponseType=any>(url: string, body: Record<string, string>): Promise<PlexusRouteRes<ResponseType>>
	headers(headers: Record<string, string>): PlexusRoute
	reset(): PlexusRoute
	config: RequestInit
}
export function route(baseURL: string='', router: PlexusRouteConfig={}): PlexusRoute {
	const _internalStore = {
		_options: deepClone(router.options || {headers: {}}),
		_baseURL: baseURL.endsWith('/') ? baseURL.substring(0, baseURL.length-1) : baseURL,
		_noFetch: false,
	}
	async function send<ResponseDataType>(path: string): Promise<PlexusRouteRes<ResponseDataType>>{
		if(_internalStore._options.headers['Content-Type'] === undefined) _internalStore._options.headers['Content-Type'] = 'text/html'
		if(_internalStore._options.method === undefined) _internalStore._options.method = "GET"

		if(_internalStore._options.method === 'GET' && _internalStore._options.headers['Content-Type'] === undefined) _internalStore._options.headers['Content-Type'] = 'application/json'
		

		const res = await fetch(`${path.match(/^http(s)?/g).length > 0 ? path : `${_internalStore._baseURL}${path.length > 0 ? '/' : ''}${path}`}`, _internalStore._options)
		let data: ResponseDataType
		let rawData: ResponseDataType

		if(res.status >= 200 && res.status < 400){

			if(_internalStore._options.headers['Content-Type'] === 'application/json' || _internalStore._options.headers['Content-Type'] === 'application/x-www-form-urlencoded'){
				data = await res.json() as ResponseDataType
			}
			else{
				rawData = await res.text() as any as ResponseDataType
			}
	
			return {
				status: res.status,
				response: res,
				rawData,
				data,
			}
		}
		else{
			return {
				status: res.status,
				response: res,
				rawData,
				data,
			}
		}
	}

	try {
		if(fetch){}
	} catch(e) {
		instance()._runtime.log('warn', 'Fetch is not supported in this environment; route will not work.')
		_internalStore._noFetch = true
	}

	return Object.freeze({
		options: function(options?: RequestInit, overwrite: boolean=false){
			
			if(overwrite) {
				_internalStore._options = deepClone(options)
				return (this as PlexusRoute)
			}

			// if(!options && !overwrite) return deepClone(_internalStore._options)
			
			_internalStore._options = deepMerge(_internalStore._options, options)
			this.headers()
			return (this as PlexusRoute)
			if(_internalStore._noFetch) return this
		},
		get(path: string, query?: Record<string, string>){
			if(_internalStore._noFetch) return null
			_internalStore._options.method = "GET"
			const params = new URLSearchParams(query)
			
			return send<ResponseType>(`${path}${params.toString().length > 0 ? `?${params.toString()}` : ""}`)
		},
		post(path: string, body: Record<string, string>){
			if(_internalStore._noFetch) return null
			_internalStore._options.method = "POST"
			_internalStore._options.body = JSON.stringify(body)
			
			if(_internalStore._options.headers['Content-Type'] === 'application/x-www-form-urlencoded'){
				const params = new URLSearchParams(body)
				return send<ResponseType>(`${path}${params.toString().length > 0 ? `?${params.toString()}` : ""}`)
			}
			else {
				send<ResponseType>(path)
			}
		},
		put(path: string, body: Record<string, string>){
			if(_internalStore._noFetch) return null
			_internalStore._options.method = "PUT"
			_internalStore._options.body = JSON.stringify(body)
			return send<ResponseType>(path)
		},
		delete(path: string){
			if(_internalStore._noFetch) return null
			_internalStore._options.method = "DELETE"			
			return send<ResponseType>(path)
		},
		patch(path: string, body: Record<string, string>){
			if(_internalStore._noFetch) return null
			_internalStore._options.method = "PATCH"
			_internalStore._options.body = JSON.stringify(body)
			return send<ResponseType>(path)

		},
		headers(headers?: Record<string, string>){
			
			if(!_internalStore._options.headers) _internalStore._options.headers = {} as HeadersInit
			if(_internalStore._noFetch) return (this as PlexusRoute)
			const temp: Record<string, string> = {}
			Object.entries(headers || _internalStore._options.headers).map(([key, value]) => {
				// uppercase the dash separated tokens
				temp[key.split('-').map(v => `${v.at(0)}${v.substring(1)}`).join('-')] = value
			})
			_internalStore._options.headers = temp
			return (this as PlexusRoute)
		},
		reset(){
			
			_internalStore._options = deepClone(router.options)
			return (this as PlexusRoute)
			if(_internalStore._noFetch) return (this as PlexusRoute)
		},
		get config(){
			return deepClone(_internalStore._options || {})
		}
	}) as PlexusRoute
}
