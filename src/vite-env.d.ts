/// <reference types="vite/client" />

declare module 'vite-plugin-cesium-build' {
  import { PluginOption } from 'vite';
  export interface BuildCesiumOptions {
    from?: string;
    to?: string;
    customCesiumBaseUrl?: boolean | string;
    css?: boolean;
    iife?: boolean;
  }
  const cesium: (options?: BuildCesiumOptions) => PluginOption;
  export default cesium;
}
