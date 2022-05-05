import { PlexusInstance } from "./instance"
type ErrorHandler = (error: any) => unknown

export interface PlexusActionHooks {
	/**
	 * Add a new error handler for this action. This will catch any errors that occur during the execution of this action and prevent a crash.
	 * @param handler? A function that will be called when an error occurs; omit to fail silently.
	 *
	 */
	onCatch(handler?: ErrorHandler): void
}
export class PlexusActionHelpers {
	private _internalStore = {
		_errorHandlers: new Set<ErrorHandler>(),
	}
	constructor(private instance: () => PlexusInstance) {}
	/**
	 * Add a new error handler for this action. This will catch any errors that occur during the execution of this action and prevent a crash.
	 * @param handler A function that will be called when an error occurs; omit to fail silently.
	 */
	onCatch(handler: ErrorHandler = () => {}) {
		if (handler) this._internalStore._errorHandlers.add(handler)
		this.instance().runtime.log("info", "created an error handler; List of error handlers for this action: ", this._internalStore._errorHandlers)
	}
	/**
	 * @internal
	 * Run all available error handlers
	 */
	runErrorHandlers(e: unknown) {
		this._internalStore._errorHandlers.forEach((handler) => handler(e))
	}
	/**
	 * @internal
	 * Does the helper instance have any errors handlers to handle an error?
	 */
	get catchError() {
		return this._internalStore._errorHandlers.size > 0
	}

	/**
	 * @internal
	 * Eject the external functions object returned to the user in the first function argument
	 */
	get hooks(): PlexusActionHooks {
		const onCatch = (handler?: ErrorHandler): void => {
			return this.onCatch(handler)
		}
		return {
			/**
			 * Add a new error handler for this action. This will catch any errors that occur during the execution of this action and prevent a crash.
			 * @param handler? A function that will be called when an error occurs; omit to fail silently.
			 *
			 */
			onCatch,
		}
	}
}

export type FunctionType = (helpers: PlexusActionHooks, ...args: any[]) => any

type InnerFunction<ResultFn extends FunctionType> = ResultFn extends (helpers: PlexusActionHooks, ...args: infer Params) => ReturnType<ResultFn>
	? (...args: Params) => ReturnType<ResultFn>
	: never

// export type PlexusAction = <ReturnData=FunctionType>(fn: FunctionType) => (...args: any) => ReturnData | Promise<ReturnData>
export type PlexusAction = typeof _action

// export function action<ReturnData=any>(fn: FunctionType): (...args: any) => ReturnData| Promise<ReturnData>;

export function _action<Fn extends FunctionType>(instance: () => PlexusInstance, fn: Fn) {
	const helpers = new PlexusActionHelpers(instance)
	if (fn.constructor.name === "Function") {
		const newAction = (...args) => {
			try {
				const ret = fn(helpers.hooks, ...args)
				return ret
			} catch (e) {
				// only return the error if there is no handler
				if (!helpers.catchError) throw e
				helpers.runErrorHandlers(e)
				// otherwise run the handler and return null
				return null
			}
		}
		return newAction as InnerFunction<Fn>
	} else if (fn.constructor.name === "AsyncFunction") {
		const newAction = async (...args) => {
			try {
				const ret = await fn(helpers.hooks, ...args)
				return ret
			} catch (e) {
				// only return the error if there is no handler
				if (!helpers.catchError) throw e
				helpers.runErrorHandlers(e)
				// otherwise run the handler and return null
				return null
			}
		}
		return newAction as InnerFunction<Fn>
	} else {
		console.warn("%cPlexus WARN:%c An action must be of type Function.", "color: #f00;", "color: #FFF;")
		throw new Error("An action must be of type Function.")
	}
}
