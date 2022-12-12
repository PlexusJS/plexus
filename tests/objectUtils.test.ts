import { deepMerge } from '@plexusjs/utils'

describe(`Test deepMerge`, () => {
	it(`Can merge arrays`, () => {
		expect(deepMerge([1, 2, 3], [4, 5, 6]).length).toBe(6)
	})
	it(`Can handle nested arrays`, async () => {
		expect(
			deepMerge(
				{
					level1: {
						level2: ['new'],
					},
				},
				{
					level1: {
						level2: ['original'],
					},
				}
			).level1.level2.length
		).toBe(2)
	})
})
