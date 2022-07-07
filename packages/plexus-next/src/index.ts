import { instance, PlexusCollectionSelector, PlexusInstance, PlexusPlugin, usePlugin } from "@plexusjs/core"

interface PlexusNextData {
	state: {
		[key: string]: any
	}
	collections: {
		[key: string]: {
			name: string
			data: Array<Object>
			groups: {
				[key: string]: Array<Object>
			}
			selectors: {
				[key: string]: any
			}
		}
	}
}

export function preserveServerState(
	nextData: {
		[key: string]: any
	} = {}
) {
	try {
		const collections = instance()._collections
		const states = instance()._states

		const data: PlexusNextData = {
			collections: {},
			state: {},
		}

		for (const state of states.values()) {
			if (state.name && state.value !== state.initialValue) {
				data.state[state.name] = state.value
			}
		}

		for (const collection of collections.values()) {
			if (collection.value.length > 0 && collection.name) {
				data.collections[collection.name] = {
					name: collection.name,
					data: collection.value,
					groups: collection.groupsValue,
					selectors: collection.selectorsValue,
				}
			}
		}

		nextData.props.PLEXUS_DATA = JSON.parse(JSON.stringify(data))
	} catch (e) {
		console.warn(e)
	}

	return nextData
}

export function loadServerState(plexus?: PlexusInstance, data: PlexusNextData = globalThis?.__NEXT_DATA__?.props?.pageProps?.PLEXUS_DATA) {
	try {
		if (!plexus) plexus = instance()

		if (isServer()) return plexus.runtime.log("debug", `not running loadServerState as we are on the server`)

		const collections = plexus._collections
		const states = plexus._states

		plexus.runtime.log("debug", `Running loadServerState with data`, data)

		if (data) {
			for (const state of states.values()) {
				const v = data.state[state.name]
				if (state.name && v && !state.name.includes("state_collection_date")) state.set(v)
			}

			for (const collection of collections.values()) {
				const fromSSR = data.collections[collection.name]
				if (fromSSR) {
					if (fromSSR.data?.length > 0) collection.collect(fromSSR.data)

					if (fromSSR.groups) {
						for (const gName in fromSSR.groups) {
							const groupData = fromSSR.groups[gName]
							collection.collect(groupData, gName)
						}
					}

					for (const name in fromSSR.selectors) {
						const selector = collection.selectors[name]
						const SSRSelector = fromSSR.selectors[name] as PlexusCollectionSelector
						if (selector.key && SSRSelector && SSRSelector.key) selector.select(SSRSelector.key)
					}
				}
			}
		}
	} catch (e) {
		console.warn(e)
	}
}

export function isServer() {
	return typeof process !== "undefined" && process?.release?.name === "node"
}

const PlexusNext: PlexusPlugin = {
	name: "NextJS",
	init: () => {
		loadServerState()
	},
}

export default PlexusNext
