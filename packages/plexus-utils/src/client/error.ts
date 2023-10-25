type PlexusErrorOptions = {
	code: string
	source: string
	stack: string
	type?: 'general' | 'api' | 'action'
} & Record<'type', string>

export class PlexusError extends Error {
	public name = 'PlexusError'
	public error = true
	type = 'general'
	constructor(
		message: string,
		public options?: Partial<PlexusErrorOptions>
	) {
		super(message)
		if (options) {
			this.options = options
			this.type = options.type || 'general'
		}
	}
	// custom error format for logging and debugging
	toString() {
		return `PlexusError${
			this.options?.source ? `(${this.options.source})` : ''
		}${this.options?.code ? `[${this.options?.code}]` : ''}: ${this.message}`
	}
}
export function handlePlexusError(
	e: unknown | Error | string,
	options?: Partial<PlexusErrorOptions>
): PlexusError {
	if (typeof e === 'string') {
		return new PlexusError(e, options)
	}

	// error-like objects
	if (e instanceof PlexusError) return e
	if (e instanceof Error) {
		return new PlexusError(
			`An error occurred during the execution of an action (${e.message})`,
			{ ...options, stack: e.stack }
		)
	}

	// generic error
	return new PlexusError(
		'An error occurred during the execution of an action',
		{
			...options,
		}
	)
}
