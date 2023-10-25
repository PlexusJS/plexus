import { isAsyncFunction } from '@plexusjs/utils'
import { PlexusInstance, instance } from './instance/instance'
import { handlePlexusError } from '@plexusjs/utils'
type ErrorHandler = (error: any) => unknown

export interface PlexusActionHooks {
	/**
	 * Add a new error handler for this action. This will catch any errors that occur during the execution of this action and prevent a crash.
	 * @param handler? A function that will be called when an error occurs; omit to fail silently.
	 * @param {boolean}useGlobal Should the global error handler be used? (default: true)
	 *
	 */
	onCatch(handler?: ErrorHandler, useGlobal?: boolean): void
	/**
	 * Ignore the default hault preActions
	 */
	ignoreInit(): void
	/**
	 * Run a function. During that function's execution, any state changes will be batched and only applied once the function has finished.
	 * @param fn The function to run in a batch
	 */
	batch<ReturnType = any>(fn: () => ReturnType): ReturnType
}
export type ActionFunction<
	Params extends any[] | [] = any[],
	Response = any,
> = (
	helpers: PlexusActionHooks,
	...args: Params
) => Response | Promise<Response>

export type InnerFunction<InputFn extends ActionFunction> = InputFn extends (
	helpers: PlexusActionHooks,
	...args: infer Params
) => ReturnType<InputFn>
	? (...args: Params) => ReturnType<InputFn>
	: never

export type PlexusAction = typeof _action

/**
 * The action helpers for a defined plexus action
 */
class PlexusActionHelpers {
	public _useGlobalCatch = true
	private _internalStore = {
		_errorHandlers: new Set<ErrorHandler>(),
	}
	_skipInit = false

	constructor(private instance: () => PlexusInstance) {}
	/**
	 * Add a new error handler for this action. This will catch any errors that occur during the execution of this action and prevent a crash.
	 * @param handler A function that will be called when an error occurs; omit to fail silently.
	 * @param useGlobal Should the global error handler be used? (default: true)
	 */
	onCatch(handler: ErrorHandler = () => {}, useGlobal = true) {
		this._useGlobalCatch = useGlobal
		if (handler) this._internalStore._errorHandlers.add(handler)
		this.instance().runtime.log(
			'info',
			'created an error handler; List of error handlers for this action: ',
			this._internalStore._errorHandlers
		)
	}
	/**
	 * @internal
	 * Run all available error handlers
	 */
	runErrorHandlers(e: unknown) {
		if (this.instance()._globalCatch && this._useGlobalCatch) {
			this.instance()._globalCatch?.(e)
			// Don't run other onCatch's
			if (this.instance().settings.exclusiveGlobalError) return
		}
		this._internalStore._errorHandlers.forEach((handler) => handler(e))
	}
	/**
	 * @internal
	 * Does the helper instance have any errors handlers to handle an error?
	 */
	get catchError() {
		return (
			this._internalStore._errorHandlers.size > 0 ??
			typeof this.instance()._globalCatch === 'function'
		)
	}

	/**
	 * Ignore the default halt for preActions
	 */
	ignoreInit() {
		this._skipInit = true
	}

	/**
	 * @internal
	 * Eject the external functions object returned to the user in the first argument of the action function
	 */
	get hooks(): PlexusActionHooks {
		return {
			onCatch: (handler?: ErrorHandler, useGlobal = true): void => {
				return this.onCatch(handler, useGlobal)
			},
			ignoreInit: (): void => {
				return this.ignoreInit()
			},
			batch: <BatchResponse>(batchFn: () => BatchResponse): BatchResponse => {
				return this.instance().runtime.batch<any>(batchFn)
			},
		}
	}
}

export function _action<Returns, Fn extends ActionFunction>(
	instance: () => PlexusInstance,
	fn: Fn & ((helpers: PlexusActionHooks, ...args: any[]) => Returns),
	batched?: boolean
): InnerFunction<Fn> {
	const helpers = new PlexusActionHelpers(instance)

	if (typeof fn !== 'function') {
		console.warn(
			'%cPlexus WARN:%c An action must be of type Function.',
			'color: #f00;',
			'color: #FFF;'
		)
		throw new Error('An action must be of type Function.')
	}
	/**
	 * if the instance is not ready, wait for it to be
	 * */
	const runInit = () => {
		if (!instance().ready && !helpers._skipInit) {
			if (isAsyncFunction(fn)) {
				// async call; just return the promise
				return instance().runtime.runInit()
			}
			// sync call
			let hold = true
			while (hold) {
				instance().runtime.runInit(() => {
					hold = false
				})
			}
		}
	}
	// we NEED this conditional. I tried to make this fit into one function definition instead of two, but it didn't work; async error catching flops for some reason.
	if (isAsyncFunction(fn)) {
		return async function newAction(...args) {
			try {
				await runInit()
				// if the action is batched, run it in a batch
				return batched
					? await instance().runtime.batch(
							async () => await fn(helpers.hooks, ...args)
					  )
					: await fn(helpers.hooks, ...args)
			} catch (e) {
				// only return the error if there is no handler
				if (!helpers.catchError && !instance()._globalCatch) {
					throw handlePlexusError(e)
				}
				helpers.runErrorHandlers(e)
				// otherwise run the handler
				return handlePlexusError(e)
			}
		} as InnerFunction<Fn>
	}
	function newAction(...args) {
		try {
			// if the instance is not ready, wait for it to be
			runInit()
			// if the action is batched, run it in a batch; otherwise run it normally
			return batched
				? instance().runtime.batch(() => fn(helpers.hooks, ...args))
				: fn(helpers.hooks, ...args)
		} catch (e) {
			// only return the error if there is no handler
			if (!helpers.catchError && !instance()._globalCatch) {
				throw handlePlexusError(e)
			}
			helpers.runErrorHandlers(e)
			// otherwise run the handler
			return handlePlexusError(e)
		}
	}
	// return the proxy function
	return newAction as InnerFunction<Fn>
}

/**
 * Generate a Plexus Action
 * @param fn The Plexus action function to run
 * @returns The intended return value of fn, or null if an error is caught
 */
export function action<Fn extends ActionFunction>(fn: Fn): InnerFunction<Fn> {
	return _action(() => instance(), fn)
}

/**
 * Generate a Plexus Action
 * @param fn The Plexus action function to run
 * @returns The intended return value of fn, or null if an error is caught
 */
export function batchAction<Fn extends ActionFunction>(
	fn: Fn
): InnerFunction<Fn> {
	return _action(() => instance(), fn, true)
}
