import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'tests/', '*.d.ts', 'src/FrontendService/FrontendVue/*'],
    },

    testTimeout: 50000,
    environment: 'node',

    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'src/FrontendService/FrontendVue', 'test/LLMCommunicationService/LLMController*'],

    // Enable or disable test watching
    watch: false,
  },
});
