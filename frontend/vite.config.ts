import { defineConfig, PluginOption } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';

import fs from 'fs';
import path from 'path';

function plugin(): PluginOption {
  const virtualModuleId = 'virtual:messages';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'my-plugin', // required, will show up in warnings and errors
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    handleHotUpdate(ctx) {
      const k = Object.keys(JSON.parse(fs.readFileSync('../messages/en.json', 'utf-8'))).filter(e => e !== '$schema');
      const langs = JSON.parse(fs.readFileSync('../emporion.inlang/settings.json', 'utf-8')).locales;
      fs.writeFileSync('messages.d.ts',
        `export type msg = "${k.join('"|"')}";\n`
        + `export const langs = ["${langs.join('","')}"] as const;`,
      );
      return ctx.modules.filter(e => !e.file?.endsWith('messages.d.ts'));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), plugin(), basicSsl()],
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
