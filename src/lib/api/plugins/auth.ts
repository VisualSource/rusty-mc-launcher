import { invoke } from "@tauri-apps/api/core";

export async function startAuthServer() {
    return invoke<void>("plugin:rmcl-auth|start_auth_server");
}

export async function closeAuthServer(port: number) {
    return invoke("plugin:rmcl-auth|close_auth_server", { port: port });
}