/// <reference types="vitest" />
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { join, resolve } from 'node:path';
import { defineConfig, type ResolvedConfig, type Plugin } from 'vite';

const devtoolsPlugin = () => {
  let cfg: ResolvedConfig;

  return {
    name: 'devtools',
    configResolved(config) {
      cfg = config;
    },
    transformIndexHtml(html) {
      if (!cfg.env.DEV) return;

      const disableReactDevtools = cfg.env.DEVTOOLS_REACT === "0";
      const disableReactScan = cfg.env.DEVTOOLS_REACT_SCANE === "0";
      const disableAll = cfg.env.DEVTOOLS === "0";

      const output = [];

      if (!disableAll || !disableReactDevtools) {
        output.push({
          attrs: { src: "http://localhost:8097", "data-name": "react-devtools" },
          tag: "script",
          injectTo: "head"
        });
      }

      if (!disableAll && !disableReactScan) {
        // <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js"></script>
        output.push({
          tag: "script",
          injectTo: "head",
          attrs: {
            src: "https://unpkg.com/react-scan/dist/auto.global.js",
            crossOrigin: "anonymous",
            "data-name": "react-scane"
          },
        });
      }

      return output;
    }
  } as Plugin
}



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
  plugins: [TanStackRouterVite(), react(), tailwindcss(), devtoolsPlugin()],
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