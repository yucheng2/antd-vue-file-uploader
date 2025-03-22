import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  html: {
    title: 'antd-vue-file-uploader',
  },
  server: {
    port: 5000,
    base: '/antd-vue-file-uploader/',
  },
  plugins: [pluginVue()],
});
