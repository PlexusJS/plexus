import { AlmostAnything } from '@plexusjs/utils'
import { _event } from './event'
import { _runtime } from './instance/runtime'

export type PlexusRuntime = ReturnType<typeof _runtime>
export type PlexusEvent = ReturnType<typeof _event>
export type PlexusWatcher<V extends any = any> = (value: V) => void

export type PlexusInternalWatcher<V extends any = any> = (
	value: V,
	from?: string
) => void

export type PlexusStateType = NonNullable<AlmostAnything>
export type Fetcher<Value extends PlexusStateType> = () => Value
