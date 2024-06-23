import { createClient } from "@hey-api/client-fetch";

export const modrinthClient = createClient({
    baseUrl: "https://api.modrinth.com/v2"
});