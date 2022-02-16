import { instance, PlexusCollectionSelector, PlexusInstance, PlexusPlugin, usePlugin } from '@plexusjs/core';

interface PlexusNextData {
  state: {
    [key: string]: any;
  }
  collections: Array<{
    name: string;
    data: any;
    groups: {
      [key: string]: Array<string>;
    };
    selectors: {
      [key: string]: any;
    };
  }>
}

export function preserveServerState (nextData: {
  [key: string]: any;
}) {
  const collections = instance()._collections;
  const states = instance()._states;

  const data: PlexusNextData = {
    collections: [],
    state: {}
  };

  for (const state of states.values()) {
    if (state.name && state.value !== state.initialValue) {
      data.state[state.name] = state.value;
    }
  }

  for (const collection of collections.values()) {
    if (collection.value.length > 0) {
      data.collections.push({
        name: collection.name,
        data: collection.value,
        groups: collection.groupsValue,
        selectors: collection.selectorsValue
      });
    }
  }

  nextData.props.PLEXUS_DATA = data;

  return nextData;
}

export function loadServerState (plexus?: PlexusInstance, data: PlexusNextData = globalThis?.__NEXT_DATA__?.props?.pageProps?.PLEXUS_DATA) {
  if (!isServer()) return;

  if (!plexus) plexus = instance();

  const collections = plexus._collections;
  const states = plexus._states;

  for (const state of states.values()) {
    const v = data.state[state.name];
    if (state.name && v) state.set(v);
  }

  for (const collection of collections.values()) {
    const fromSSR = data.collections.find(c => c.name === collection.name);
    if (fromSSR) {
      if (fromSSR.groups) {
        for (const gName in fromSSR.groups) {
          const gKeys = fromSSR.groups[gName];
          if (gKeys?.length > 0) {
            const groups = collection.getGroup(gName);
            for (const gk of gKeys) groups.add(gk);
            const toCol = fromSSR.data.filter(d => gKeys.includes(d[collection.config.primaryKey]));
            for (const data of toCol) collection.collect(data, gName);
          }
        }
      }

      if (fromSSR.data?.length > 0) collection.collect(fromSSR.data);

      for (const key in fromSSR.selectors) if (collection.selectors[key].key) collection.selectors[key].select((fromSSR.selectors[key] as PlexusCollectionSelector).key);
    }
  }
}

export function isServer() {
  return typeof process !== 'undefined' && process?.release?.name === 'node';
}

export * from '@plexusjs/react';

const PlexusNext: PlexusPlugin = {
  name: 'NextJS',
  init: (inst) => {
    loadServerState()
  }
}

export default PlexusNext;