type Options = {
	name?: string
}
type MaybeAsyncFunction = () => void | Promise<void>
export class Task {
	action: MaybeAsyncFunction = () => {}
	name = ''
	constructor(taskAction: () => void, options: Options)
	constructor(taskAction: MaybeAsyncFunction, options: Options) {
		this.name = options.name || ''
		this.action = taskAction
	}
	
}
