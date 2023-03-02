import { defineConfig } from 'vite';
import { env } from 'node:process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  server: {
    strictPort: true
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@context": resolve(__dirname, "./src/lib/context"),
      "@system": resolve(__dirname, "./src/lib/system/"),
      "@component": resolve(__dirname, "./src/components"),
      "@lib": resolve(__dirname, "./src/lib"),
      "@hook": resolve(__dirname, "./src/lib/hooks/"),
      "@auth": resolve(__dirname, "./src/lib/auth"),
      "@page": resolve(__dirname, "./src/pages"),
      "@util": resolve(__dirname, "./src/utils")
    }
  },
  envPrefix: ["PUBLIC_VITE_", "VITE_", "TAURI_"],
  build: {
    target: env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!env.TAURI_DEBUG,
  },
  plugins: [react()],
})
