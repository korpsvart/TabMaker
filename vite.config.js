import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/TabMaker/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  rules: [
    {
      test: /\.less$/,
      use: [
        'vue-style-loader',
        'css-loader',
        'less-loader'
      ]
    }
  ]
})
