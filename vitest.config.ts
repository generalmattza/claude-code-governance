import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        '**/dist/**',
        '**/*.test.ts',
        '**/types.ts',
        // CLI entrypoint and barrel exports are exercised end-to-end via integration tests
        // and manual smoke runs; unit-test coverage of pure wiring/re-exports is low value.
        'packages/cli/src/index.ts',
        'packages/core/src/index.ts',
      ],
    },
    include: ['packages/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
