import { PlexusInstance } from './instance/instance'
import { FunctionType, _action } from './action'
import { genUID } from '@plexusjs/utils'
type ErrorHandler = (error: any) => unknown

export interface PlexusPreActionConfig {
	lazy?: boolean
}
export class PreActionInstance<Fn extends FunctionType = FunctionType> {
	private _internalStore = {
		_ran: false,
		_id: genUID(),
	}

	/**
	 * The action associated with this PreAction
	 */
	action: ReturnType<typeof _action>
	/**
	 *	The internal id of the PreAction
	 */
	get id(): string {
		return this._internalStore._id
	}

	constructor(
		private instance: () => PlexusInstance,
		fn: Fn,
		config: PlexusPreActionConfig = {}
	) {
		this.action = _action<Fn>(instance, fn)
		instance()._inits.set(this.id, this)
		if (!config.lazy) {
			this.run()
		}
	}

	/**
	 * Is this action complete?
	 */
	get complete() {
		return this._internalStore._ran
	}

	/**
	 *
	 * @returns The result of the action
	 */
	async run() {
		let result: any
		if (
			this.action instanceof Function &&
			this.action.constructor.name === 'Function'
		) {
			result = this.action()
		} else if (this.action.constructor.name === 'AsyncFunction') {
			result = await this.action()
		}
		this._internalStore._ran = true
		return result
	}
}
export type PlexusPreAction<Fn extends FunctionType = FunctionType> =
	PreActionInstance<Fn>

export function _preaction<Fn extends FunctionType>(
	instance: () => PlexusInstance,
	fn: Fn,
	config?: PlexusPreActionConfig
) {
	return new PreActionInstance<Fn>(instance, fn, config)
}
