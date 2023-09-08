import { PlexusInstance } from './instance/instance'

export class PlexusError extends Error {
	public name = 'PlexusError'
	public error = true
	constructor(
		message: string,
		public options?: Partial<{ code: string; origin: string; stack: string }>
	) {
		super(message)
	}
	// custom error format for logging and debugging
	toString() {
		return `PlexusError: ${this.message} (${this.options?.code ?? 'NO_CODE'})`
	}
}
export function handlePlexusError(e: unknown | Error | string): PlexusError {
	if (typeof e === 'string') {
		return new PlexusError(e)
	}

	// error-like objects
	if (e instanceof PlexusError) return e
	if (e instanceof Error) {
		return new PlexusError(
			`An error occurred during the execution of an action (${e.message})`,
			{ origin: 'action', stack: e.stack }
		)
	}

	// generic error
	return new PlexusError(
		'An error occurred during the execution of an action',
		{
			origin: 'action',
		}
	)
}
