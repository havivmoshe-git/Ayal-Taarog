import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The site is served from https://havivmoshe-git.github.io/Ayal-Taarog/,
// so every asset URL needs the repository name as a prefix.
export default defineConfig({
  base: '/Ayal-Taarog/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
  },
});
