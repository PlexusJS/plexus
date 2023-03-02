import { PlexusInstance } from './instance'
type ErrorHandler = (error: any) => unknown

export interface PlexusActionHooks {
	onCatch(handler?: ErrorHandler, useGlobal?: boolean): void
	/**
	 * Ignore the default hault preActions
	 */
	ignoreInit(): void
	batch<ReturnType extends any = any>(
		fn: () => ReturnType
	): ReturnType | Promise<ReturnType>
}
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
	 * Run a function. During that function's execution, any state changes will be batched and only applied once the function has finished.
	 * @param fn The function to run in a batch
	 */
	batch<BatchFunction extends () => unknown | Promise<unknown>>(
		fn: BatchFunction
	): ReturnType<BatchFunction> {
		return this.instance().runtime.batch(fn)
	}

	/**
	 * @internal
	 * Eject the external functions object returned to the user in the first argument of the action function
	 */
	get hooks(): PlexusActionHooks {
		const onCatch = (handler?: ErrorHandler, useGlobal = true): void => {
			return this.onCatch(handler, useGlobal)
		}
		const ignoreInit = (): void => {
			return this.ignoreInit()
		}
		const batch = <ReturnType extends any = any>(
			batchedActions: () => ReturnType | Promise<ReturnType>
		) => {
			return this.batch(batchedActions)
		}
		return {
			/**
			 * Add a new error handler for this action. This will catch any errors that occur during the execution of this action and prevent a crash.
			 * @param handler? A function that will be called when an error occurs; omit to fail silently.
			 *
			 */
			onCatch,
			ignoreInit,
			batch,
		}
	}
}

export type FunctionType = (helpers: PlexusActionHooks, ...args: any[]) => any

export type InnerFunction<ResultFn extends FunctionType> = ResultFn extends (
	helpers: PlexusActionHooks,
	...args: infer Params
) => ReturnType<ResultFn>
	? (...args: Params) => ReturnType<ResultFn>
	: never

// export type PlexusAction = <ReturnData=FunctionType>(fn: FunctionType) => (...args: any) => ReturnData | Promise<ReturnData>
export type PlexusAction = typeof _action

export function _action<Fn extends FunctionType>(
	instance: () => PlexusInstance,
	fn: Fn,
	batched?: boolean
) {
	const helpers = new PlexusActionHelpers(instance)

	if (fn.constructor.name === 'Function') {
		function newAction(...args) {
			try {
				// if the instance is not ready, wait for it to be
				// !NOTE: this is probably not a good way to do this, but it works for now
				if (!instance().ready && !helpers._skipInit) {
					let hold = true
					while (hold) {
						instance().runtime.runInit(() => {
							hold = false
						})
					}
				}
				// if the action is batched, run it in a batch
				if (batched) {
					return instance().runtime.batch(() => {
						return fn(helpers.hooks, ...args)
					})
				}
				// run the function
				return fn(helpers.hooks, ...args)
			} catch (e) {
				// only return the error if there is no handler
				if (!helpers.catchError && !instance()._globalCatch) throw e
				helpers.runErrorHandlers(e)
				// otherwise run the handler and return null
				return null
			}
		}
		// return the proxy function
		return newAction as InnerFunction<Fn>
		// return proxyFn as InnerFunction<Fn>
	} else if (fn.constructor.name === 'AsyncFunction') {
		const newAction = async (...args) => {
			try {
				// if the instance is not ready, wait for it to be
				if (!instance().ready && !helpers._skipInit) {
					await instance().runtime.runInit()
				}
				// if the action is batched, run it in a batch
				if (batched) {
					return instance().runtime.batch(() => {
						return fn(helpers.hooks, ...args)
					})
				}
				// run the function
				return await fn(helpers.hooks, ...args)
			} catch (e) {
				// only return the error if there is no handler
				if (!helpers.catchError && !instance()._globalCatch) throw e
				helpers.runErrorHandlers(e)
				// otherwise run the handler and return null
				return null
			}
		}
		// return the proxy function
		return newAction as InnerFunction<Fn>
		// return proxyFn as InnerFunction<Fn>
	} else {
		console.warn(
			'%cPlexus WARN:%c An action must be of type Function.',
			'color: #f00;',
			'color: #FFF;'
		)
		throw new Error('An action must be of type Function.')
	}
}
