export type TaskOptions = {
	name?: string
}
type MaybeAsyncFunction = () => void | Promise<void>
export class Task {
	action: MaybeAsyncFunction = () => {}
	name = ''
	constructor(taskAction: () => void, options: TaskOptions)
	constructor(taskAction: MaybeAsyncFunction, options: TaskOptions) {
		this.name = options.name || ''
		this.action = taskAction
	}
}
