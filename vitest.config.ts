/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: process.env.TEST_ENV === 'integration' ? 'node' : 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: process.env.TEST_ENV === 'integration' ? ['**/__integration_tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)'] : ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: process.env.TEST_ENV === 'integration' ? [] : ['**/__integration_tests__/**'],
  },
});