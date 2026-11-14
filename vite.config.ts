import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  // fonts go inside the CSS as data URIs: the single-file build (assets/ removed) keeps its typefaces
  build: { assetsInlineLimit: (file: string) => (file.endsWith('.woff2') ? true : undefined) },
  test: { include: ['test/**/*.test.ts'] }
} as any);
