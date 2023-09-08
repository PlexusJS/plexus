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
