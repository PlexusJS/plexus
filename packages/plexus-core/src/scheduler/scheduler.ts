import { Task, TaskOptions } from './task'

export class Scheduler {
	schedule: Array<Task> = []
	private taskRunning: boolean = false
	promises: Array<Promise<any>> = []
	paused: boolean = false
	name: string
	constructor(name: string) {
		this.name = name
	}
	addTask(taskAction: () => void, options?: TaskOptions) {
		const task = new Task(taskAction, options)
		this.schedule.push(task)
		if (!this.paused && !this.taskRunning) {
			this.start()
		}
		return task
	}
	start() {
		if (this.taskRunning) {
			return
		}
		this.taskRunning = true
		const task = this.schedule.shift()
		if (task) {
			// this worked but it was not allowing sync tasks to run until async tasks were done
			// ;(async () => await task.action())().then(() => {
			// 	this.taskRunning = false
			// 	this.run()
			// })
			// this is the new way
			const promise = task.action()
			if (promise instanceof Promise) {
				this.promises.push(promise)
				promise.then(() => {
					this.promises = this.promises.filter((p) => p !== promise)
					if (this.promises.length === 0) {
						this.taskRunning = false
					}
					this.start()
				})
			} else {
				this.taskRunning = false
				this.start()
			}
		} else {
			this.taskRunning = false
		}
	}
	stop() {
		this.paused = true
	}
	clear() {
		this.schedule = []
	}
	removeTask(task: Task) {
		this.schedule = this.schedule.filter((t) => t !== task)
	}
}
