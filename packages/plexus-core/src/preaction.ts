import { PlexusInstance } from "./instance"
import { FunctionType, _action } from "./action"
import { genUID } from "./helpers"
type ErrorHandler = (error: any) => unknown

export interface PlexusPreActionConfig {
	lazy?: boolean
}
export class PreActionInstance<Fn extends FunctionType = FunctionType> {
	private _internalStore = {
		_errorHandlers: new Set<ErrorHandler>(),
		_finished: false,
	}

	action: ReturnType<typeof _action>
	id: string

	constructor(private instance: () => PlexusInstance, fn: Fn, config: PlexusPreActionConfig = {}) {
		this.action = _action<Fn>(instance, fn)
		this.id = genUID()
		instance()._inits.set(this.id, this)
		if (!config.lazy) {
			this.run()
		}
	}

	/**
	 * Is this action complete?
	 */
	get complete() {
		return this._internalStore._finished
	}

	async run() {
		let result: any
		if (this.action instanceof Function && this.action.constructor.name === "Function") {
			result = this.action()
		} else if (this.action.constructor.name === "AsyncFunction") {
			result = await this.action()
		}
		this._internalStore._finished = true
		return result
	}
}
export type PlexusPreAction<Fn extends FunctionType = FunctionType> = PreActionInstance<Fn>

export function _preaction<Fn extends FunctionType>(instance: () => PlexusInstance, fn: Fn, config?: PlexusPreActionConfig) {
	return new PreActionInstance<Fn>(instance, fn, config)
}
