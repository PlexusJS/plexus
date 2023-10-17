// this one is a test of internal systems
import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { EventEngine } from '@plexusjs/core/src/instance/engine'

const engine = new EventEngine()
describe('INTERNAL: Engine test', () => {
	test('Test adding and removing a listener', () => {
		const destroyer = engine.on('jump', (height: number) => {
			console.log(`We jumped ${height} meters high!`)
		})

		engine.emit('jump', 3)

		destroyer()

		// this shouldn't run the listener
		engine.emit('jump', 3)
	})
	test('Test adding multiple listeners and removing one', () => {
		const destroyer = engine.on('jump', (height: number) => {
			console.log(`We jumped ${height} meters high!`)
		})
		const destroyer2 = engine.on('jump', (height: number) => {
			console.log(`We jumped ${(height * 3.28084).toFixed(2)} feet high!`)
		})

		engine.emit('jump', 3)

		destroyer()

		// this shouldn't run the listener
		engine.emit('jump', 3)
	})
})
