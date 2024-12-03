/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const viteConfig = defineConfig({
  plugins: [react()],
});

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
  },
});

export default {
  ...viteConfig,
  ...vitestConfig,
};