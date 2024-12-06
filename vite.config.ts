/// <reference types="vitest" />
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from "@vitejs/plugin-react-swc";
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
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
  clearScreen: false,
  server: {
    strictPort: true,
    watch: {
      ignored: [
        "src-tauri/",
        "launcher-lib/",
        "patches/",
        "profiling/"
      ],
    },
  },
});