import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  server: {
    port: 5000,
  },
  plugins: [pluginVue()],
});
