import * as React from 'react';
import {usePlexus} from '../dist';
import * as renderer from 'react-test-renderer';
import { PlexusStateInstance, state } from '@plexusjs/core';

let myState: PlexusStateInstance
beforeEach(() => {
	myState = state('yes')
})

describe('Test react integration', () => {
	test('usePlexus hook', () => {
		function RandomComponent() {
			const stateValue = usePlexus(myState)
			return <div>
				<p>{stateValue}</p>
			</div>
		}
		const tree = renderer.create(<RandomComponent />).toJSON();
		expect(tree).toMatchSnapshot();
	})
})