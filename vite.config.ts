import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers',
          dest: 'cesium/'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/ThirdParty',
          dest: 'cesium/'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets',
          dest: 'cesium/'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets',
          dest: 'cesium/'
        }
      ]
    })
  ],
  resolve: {
    alias: [
      {
        find: /^cesium$/,
        replacement: path.resolve(__dirname, 'node_modules/cesium/Build/CesiumUnminified/index.js')
      }
    ]
  },
  server: {
    port: 5173,
    host: true
  }
});
