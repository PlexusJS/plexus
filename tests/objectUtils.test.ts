import { deepMerge } from '@plexusjs/utils'

describe(`Test deepMerge`, () => {
	it(`Can merge arrays`, () => {
		expect(deepMerge([1, 2, 3], [4, 5, 6]).length).toBe(6)
	})
	it(`Can handle nested arrays`, async () => {
		const mergeValue = deepMerge(
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
		)
		expect(mergeValue.level1.level2.length).toBe(2)
		// expect(mergeValue.level1.level2).toBe(2)
	})
})
