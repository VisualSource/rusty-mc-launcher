/// <reference types="vitest" />
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { join, resolve } from 'node:path';
import { defineConfig } from 'vite';

const aliases = [
  ["@"],
  ["@masl", "lib/masl"],
  ["@context", "lib/context"],
  ["@system", "lib/system"],
  ["@component", "components"],
  ["@lib", "lib"],
  ["@ui", "components/ui"],
  ["@hook", "hooks"],
  ["@hooks", "hooks"],
  ["@auth", "lib/auth",],
  ["@page", "pages"],
  ["@util", "utils"]
];

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: aliases.reduce((prev, [alias, path]) => {
      prev[alias] = path ? resolve(__dirname, join("src", path)) : resolve(__dirname, "src");
      return prev;
    }, {} as Record<string, string>)
  },
  optimizeDeps: {
    entries: "index.html"
  },
  clearScreen: false,
  server: {
    watch: {
      ignored: [
        "src-tauri",
        "launcher-lib",
        "patches",
        "profiling"
      ].map(file => resolve(__dirname, file)),
    },
  },
});