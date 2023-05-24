import { Task } from './task'

export class Scheduler {
	static schedule: Array<Task> = []
	private static taskRunning: boolean = false
	name: string
	constructor(name: string) {
		this.name = name
	}
	static addTask(task: Task) {
		this.schedule.push(task)
	}
	static run() {
		if (this.taskRunning) {
			return
		}
		this.taskRunning = true
		const task = this.schedule.shift()
		if (task) {
			;(async () => await task.action())().then(() => {
				this.taskRunning = false
				this.run()
			})
		} else {
			this.taskRunning = false
		}
	}
	static clear() {
		this.schedule = []
	}
	static removeTask(task: Task) {
		this.schedule = this.schedule.filter((t) => t !== task)
	}
}
