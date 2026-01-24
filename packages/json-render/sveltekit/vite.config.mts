/// <reference types='vitest' />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  root: __dirname,
  cacheDir: path.join(workspaceRoot, 'node_modules/.vite/packages/json-render/sveltekit'),
  plugins: [
    svelte({
      compilerOptions: {
        dev: false,
      },
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'JsonRenderSveltekit',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: (id) => {
        return id === 'svelte' || id.startsWith('svelte/') || id.startsWith('@json-render/core');
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['verbose', 'junit'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
});
