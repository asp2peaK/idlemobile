import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLE=1 — собрать игру в один HTML-файл (открывается без сервера и без npm)
const single = process.env.SINGLE === '1';

export default defineConfig({
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  base: './',
  build: single ? { outDir: 'dist-single', emptyOutDir: true } : {},
});
