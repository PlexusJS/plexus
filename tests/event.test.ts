import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { event, state } from '@plexusjs/core'

describe('Testing Event Function', () => {
  test('Emitting a string', async () => {
    const myEvent = event<string>()
    // const value = state(1)
    const destroy = myEvent.on((value) => {
      expect(value).toBeDefined()
      expect(value).toBe('test')
    })

    myEvent.emit('test')
    // console.log(myApi.config)
    destroy()
  })
  test('Emitting a number', async () => {
    const myEvent = event<number>()
    const _value = state(1)
    const destroy = myEvent.on((value) => {
      expect(value).toBe(4)
      _value.set(value)
    })

    myEvent.emit(4)

    await new Promise<void>((ret, rej) => {
      setTimeout(() => {
        ret()
        expect(_value.value).toBe(4)
        destroy()
      }, 100)
    })

    // console.log(myApi.config)
  })

  test('Emitting a string, once', async () => {
    const myEvent = event<string>()
    // const value = state(1)
    let count = 0
    const destroy = myEvent.once((value) => {
      expect(value).toBeDefined()
      expect(value).toBe('test')
      ++count
    })

    myEvent.emit('test')
    expect(count).toBe(1)
    myEvent.emit('test')
    expect(count).toBe(1)
    // console.log(myApi.config)
    destroy()
  })
})
