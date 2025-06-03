import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import { join } from 'path';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginLess({
      lessOptions: {
        modifyVars: {
          '@primary-color': '#1890ff',
          '@link-color': '#1890ff',
          '@success-color': '#52c41a',
          '@warning-color': '#faad14',
          '@error-color': '#ff4d4f',
          '@font-size-base': '14px',
          '@heading-color': 'rgba(0, 0, 0, 0.85)',
          '@text-color': 'rgba(0, 0, 0, 0.65)',
          '@text-color-secondary': 'rgba(0, 0, 0, 0.45)',
          '@disabled-color': 'rgba(0, 0, 0, 0.25)',
          '@border-radius-base': '4px',
          '@border-color-base': '#d9d9d9',
          '@box-shadow-base': '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
        javascriptEnabled: true,
      },
    }),
  ],
  source: {
    alias: {
      '@': join(__dirname, './src'),
    },
    entry: {
      index: './src/index.tsx',
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
