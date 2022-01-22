
export interface PlexusActionHelpers {
	/**
	 * Add a new error handler to this action. This will catch any errors that occur during the execution of this action and prevent a crash.
	 * @param handler? A function that will be called when an error occurs, omit to fail silently.
	 */
	onCatch(handler?: (error: any) => void): void

}

type FunctionType = (helpers: PlexusActionHelpers, ...args: any) => any
type InnerFunction<ReturnData extends FunctionType> = ReturnData extends (helpers: PlexusActionHelpers, ...args: infer Params) => ReturnType<ReturnData> 
? (...args: Params) => ReturnType<ReturnData> 
: never;

// export type PlexusAction = <ReturnData=FunctionType>(fn: FunctionType) => (...args: any) => ReturnData | Promise<ReturnData>
export type PlexusAction = typeof action

// export function action<ReturnData=any>(fn: FunctionType): (...args: any) => ReturnData| Promise<ReturnData>;
/**
 * Generate a Plexus Action
 * @param fn The Plexus action function to run
 * @returns The intended return value of fn, or null if an error is caught
 */
export function action<Type extends FunctionType = FunctionType>(fn: Type){
	const _internalStore = {
		_errorHandlers: new Set<(error: any) => void>(),

	} 

	const helpers: PlexusActionHelpers = Object.freeze({
		onCatch: (handler: (error: any) => void = () => {}) => {
			_internalStore._errorHandlers.add(handler)
		}
	})


	if(fn.constructor.name === 'Function'){
		const newAction =  (...args) => {
			try{
				const res = fn(helpers, ...args)
				return res
			} catch(e){
				// only return the error if there is no handler
				if(_internalStore._errorHandlers.size === 0) throw e
				_internalStore._errorHandlers.forEach(handler => handler(e))
				// otherwise run the handler and return null
				return null
			}
		}
		return newAction as InnerFunction<Type>
	}
	else if (fn.constructor.name === 'AsyncFunction'){
		const newAction =  async (...args) => {
			try{
				const res = await fn(helpers, ...args)
				return res
			} catch(e){
				// only return the error if there is no handler
				if(_internalStore._errorHandlers.size === 0) throw e
				_internalStore._errorHandlers.forEach(handler => handler(e))
				// otherwise run the handler and return null
				return null
			}
		}
		return newAction as InnerFunction<Type>
	}
	else{
		console.warn('%cPlexus WARN:%c An action must be of type Function.', 'color: #f00;', 'color: #FFF;')
	}

	
}