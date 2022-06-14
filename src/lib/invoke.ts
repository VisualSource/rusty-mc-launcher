import { invoke } from "@tauri-apps/api/tauri";
import type { Account, Loader, Minecraft, VersionId } from "../types";

export const InvokeNews = (pages: number = 10) => invoke<string>("news", { pages });
export const InvokeGameDir = () => invoke<string>("game_dir");
export const GetVanillaVersions = () => invoke<Array<Minecraft>>("get_vanilla_versions");
export const GetLoaderVersions = (loader: Loader | "none", minecraft: Minecraft) => invoke<Array<string>>("get_loader_versions",{ loader, minecraft });
export const InvokeLogin = () => invoke<void>("login");
export const InvokeLogout = () => invoke<void>("logout");
export const TokenRefresh = (token: string) => invoke<Account>("token_refresh",{ token });
export const CheckVersion = (version: VersionId) => invoke<boolean>("check_version",{ version });
export const RunMinecraft = (props: { version: VersionId, profile: Account }) => invoke("run_minecraft",{ params: props });
export const InstallClient = (manifest: string) => invoke<void>("install_client", { manifest });
export const Log = (msg: string, level: "info" | "warn" | "debug" | "error" | null = null) => invoke<void>("log", { msg, level });