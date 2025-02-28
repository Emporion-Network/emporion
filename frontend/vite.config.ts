import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';

import path from 'path';

export default defineConfig({
  plugins: [svelte(), basicSsl()],
  resolve: {
    alias: {
      '@ts-client': path.resolve(__dirname, '../ts-client'),
      '@common': path.resolve(__dirname, '../common/index.ts'),
      '@': path.resolve(__dirname, './src/'),
    },
  },
  server: {
    proxy: {
      '/rpc': {
        target: 'http://localhost:26657/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/rpc/, ''),
      },
      '/api': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});
