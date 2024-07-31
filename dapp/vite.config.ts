import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server:{
    proxy:{
       '/rpc': {
        target: 'http://localhost:26657/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc/, ''),
      },
      '/api': {
        target: 'http://localhost:1317/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/price': {
        target:"https://api.coingecko.com/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/price/, ''),
      }
    }
  }
})
