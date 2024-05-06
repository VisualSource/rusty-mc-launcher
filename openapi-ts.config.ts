import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    format: "prettier",
    client: "fetch",
    input: "https://docs.modrinth.com/redocusaurus/plugin-redoc-0.yaml",
    output: "./src/lib/api/modrinth",
    schemas: false
});