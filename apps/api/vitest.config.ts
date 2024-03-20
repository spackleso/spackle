// import type { Config } from 'jest'

// const config: Config = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   testMatch: ['**/*.test.ts'],
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/src/$1',
//   },
// }

// export default config

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },
})
