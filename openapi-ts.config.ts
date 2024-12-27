import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    client: "@hey-api/client-fetch",
    output: {
        format: "biome",
        lint: "biome",
        path: "./src/lib/api/modrinth"
    },
    input: "https://raw.githubusercontent.com/modrinth/code/refs/heads/main/apps/docs/public/openapi.yaml",
});