import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'tests/', '*.d.ts', 'src/FrontendService/FrontendVue/*'],
    },

    testTimeout: 55500,
    environment: 'node',

    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'src/FrontendService/FrontendVue', 
        'test/LLMCommunicationService/LLMController*', 'test/LLMCommunicationService/LLMService*'], // Avoid tests that actually access API

    // Enable or disable test watching
    watch: false,
  },
});
