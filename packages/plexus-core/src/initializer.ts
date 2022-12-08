import { Watchable } from '.'

export function WatchableInitializer<ValueType extends any>(
	watchable: Watchable<ValueType>,
	initFunction: (currentValue?: ValueType) => ValueType
) {
	watchable
}
