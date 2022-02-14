import * as React from 'react';
import {usePlexus} from '../dist';
import * as renderer from 'react-test-renderer';
import { collection, PlexusStateInstance, state } from '@plexusjs/core';

let myState: PlexusStateInstance
beforeEach(() => {
	myState = state('yes')
})

describe('Test react integration', () => {
	test('usePlexus hook w/state', () => {
		function RandomComponent() {
			const stateValue = usePlexus(myState)
			return <div>
				<p>{stateValue}</p>
			</div>
		}
		const tree = renderer.create(<RandomComponent />).toJSON();
		expect(tree).toMatchSnapshot();
	})
	test('usePlexus hook w/collection group', () => {
		function RandomComponent() {
			const col = collection().createGroup('test');
			col.collect({ id: 'pog', a: 1 }, 'test');
			const groupValue = usePlexus(col.groups.test);
			return <div>
				<p>{JSON.stringify(groupValue)}</p>
			</div>
		}
		const tree = renderer.create(<RandomComponent />).toJSON();
		expect(tree).toMatchSnapshot();
	})
})