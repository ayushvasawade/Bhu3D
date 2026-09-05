import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: [
      {
        find: /^cesium$/,
        replacement: path.resolve(__dirname, 'node_modules/cesium/Build/CesiumUnminified/index.js')
      }
    ]
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('/node_modules/cesium/Build/CesiumUnminified/')
  },
  server: {
    port: 5173,
    host: true
  }
});
