import { _event } from './event'
import { _runtime } from './runtime'
export type AlmostAnything =
  | string
  | number
  | symbol
  | Record<any, any>
  | Array<any>
  | Object

export type PlexusRuntime = ReturnType<typeof _runtime>
export type PlexusEvent = ReturnType<typeof _event>
export type PlexusWatcher<V extends any = any> = (value: V) => void
