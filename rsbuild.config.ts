import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { join } from 'path';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    alias: {
      '@': join(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  html: {
    title: '计划管理系统',
  },
});
