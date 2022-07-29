import { instance, PlexusCollectionSelector, PlexusInstance, PlexusPlugin, usePlugin } from "@plexusjs/core"

interface PlexusNextData {
	state: Record<string, any>

	collections: Record<
		string,
		{
			name: string
			data: Array<Object>
			groups: Record<string, Array<Object>>
			selectors: Record<string, any>
		}
	>
}

export function preserveServerState(
	nextData: {
		props?: Record<string, any>
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
		// parse the states
		for (const state of states.values()) {
			if (state.name && state.value !== state.initialValue) {
				data.state[state.name] = state.value
			}
		}
		// parse the collections
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
		// ensure the incoming next data is valid
		if (!nextData.props) {
			nextData.props = {}
		}
		// inject plexus data into props object
		nextData.props.PLEXUS_DATA = JSON.parse(JSON.stringify(data))
	} catch (e) {
		console.warn(e)
	}

	return nextData
}

export function loadServerState(plexus?: PlexusInstance, data: PlexusNextData = globalThis?.__NEXT_DATA__?.props?.pageProps?.PLEXUS_DATA) {
	try {
		if (!plexus) plexus = instance()

		if (isServer()) return plexus.runtime.log("warn", `Not running loadServerState; Client-Side Only.`)

		const collections = plexus._collections
		const states = plexus._states

		plexus.runtime.log("debug", `Running loadServerState with data`, data)

		if (data) {
			for (const state of states.values()) {
				// if the state does not have a name
				if (!state.name) {
					continue
				}
				const v = data.state[state.name]
				if (state.name && v && !state.name.includes("state_collection_date")) state.set(v)
			}

			for (const collection of collections.values()) {
				// if the collection does not have a name
				if (!collection.name) {
					continue
				}
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
