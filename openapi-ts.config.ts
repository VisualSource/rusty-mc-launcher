import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    client: "@hey-api/client-fetch",
    output: {
        format: "biome",
        lint: "biome",
        path: "./src/lib/api/modrinth"
    },
    input: "https://docs.modrinth.com/redocusaurus/plugin-redoc-0.yaml",
    schemas: false,
});