/// <reference types="vitest" />
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/

export default defineConfig({
  clearScreen: false,
  server: {
    strictPort: true
  },
  test: {},
  resolve: {
    alias: {
      "@masl": resolve(__dirname, "./src/lib/masl"),
      "@": resolve(__dirname, "./src"),
      "@context": resolve(__dirname, "./src/lib/context"),
      "@system": resolve(__dirname, "./src/lib/system/"),
      "@component": resolve(__dirname, "./src/components"),
      "@lib": resolve(__dirname, "./src/lib"),
      "@polyfill": resolve(__dirname, "./src/lib/polyfill"),
      "@hook": resolve(__dirname, "./src/hooks/"),
      "@auth": resolve(__dirname, "./src/lib/auth"),
      "@page": resolve(__dirname, "./src/pages"),
      "@util": resolve(__dirname, "./src/utils")
    }
  },
  envPrefix: ["PUBLIC_VITE", 'VITE_', 'TAURI_PLATFORM', 'TAURI_ARCH', 'TAURI_FAMILY', 'TAURI_PLATFORM_VERSION', 'TAURI_PLATFORM_TYPE', 'TAURI_DEBUG'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG
  },
  plugins: [TanStackRouterVite(), react()]
});