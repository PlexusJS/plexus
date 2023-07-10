/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['./tests/**/*.test.ts', './tests/**/*.test.tsx'],
		globals: true,
		environment: 'jsdom',
	},
})
