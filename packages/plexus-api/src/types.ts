export interface PlexusApiRes<DataType = any> {
	status: number
	response: Response
	rawData: string
	blob?: Blob
	data: DataType
	ok: boolean
	hasCookie: (cookieName: string) => boolean
}
export interface PlexusApiConfig {
	defaultOptions?: PlexusApiOptions
	timeout?: number
	// Deprecated
	silentFail?: boolean

	throws?: boolean
	onResponse?: (req: PlexusApiReq, res: PlexusApiRes) => void
	headers?:
		| Record<string, string>
		| (() => Record<string, string>)
		| (() => Promise<Record<string, string>>)
}
export interface PlexusApiReq<BodyType = any> {
	path: string
	baseURL: string
	fullURL: string
	method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'
	headers: Record<string, string>
	body: BodyType
	options: PlexusApiOptions
}
export interface PlexusApiOptions {
	cache?: RequestInit['cache']
	credentials?: RequestInit['credentials']
	integrity?: RequestInit['integrity']
	keepalive?: RequestInit['keepalive']
	mode?: RequestInit['mode']
	redirect?: RequestInit['redirect']
	referrer?: RequestInit['referrer']
	signal?: RequestInit['signal']
	window?: RequestInit['window']
}

export interface PlexusApiFetchOptions extends PlexusApiOptions {
	headers?: RequestInit['headers']
}

export interface PlexusApiSendOptions extends PlexusApiFetchOptions {
	method: ApiMethod
	body?: RequestInit['body']
}

export interface ApiStore {
	options: PlexusApiOptions
	optionsInit: PlexusApiOptions
	timeout: number | undefined
	baseURL: string
	noFetch: boolean
	authToken: string
	silentFail: boolean
	throws: boolean
	onResponse?: (req: PlexusApiReq, res: PlexusApiRes) => void
}

export type ApiMethod = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'
