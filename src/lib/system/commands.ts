import { invoke } from "@tauri-apps/api";
import type { FileDownload } from "../api/modrinth";
import type { LaunchConfig } from "./launch_config";
import logger from "./logger";

export class PortGenerator {
  static INSTANCE: PortGenerator | null;
  static getInstance(): PortGenerator {
    if (!PortGenerator.INSTANCE) {
      PortGenerator.INSTANCE = new PortGenerator();
    }
    return PortGenerator.INSTANCE;
  }
  public port: number = 3123;
  constructor() { }
  setPort() {
    this.port =
      [3123, 4124, 5434].at(Math.floor((Math.random() * 100) % 3)) ?? 3123;
    return this.port;
  }
}

export const startAuthServer = async () => {
  try {
    const generator = PortGenerator.getInstance();
    await invoke("start_server", {
      port: generator.port,
      origin: window.location.origin,
    });
    return generator.port;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const installMods = async (
  id: string,
  files: FileDownload[],
  game_dir?: string,
) => {
  await invoke("install_mods", { id, gameDir: game_dir, files });
};

export const install = async (version: string, game_dir?: string) => {
  try {
    await invoke("install", { gameDir: game_dir, version });
  } catch (error) {
    logger.error(error);
  }
};

export const installPack = async (
  file: FileDownload,
  type: "Resource" | "Shader",
  game_dir?: string,
) => invoke<void>("install_pack", { file, packType: type, gameDir: game_dir });

export const check_install = async (version: string, game_dir?: string) => {
  try {
    const result = await invoke<boolean>("check_install", {
      version,
      gameDir: game_dir,
    });
    return result;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const play = async (settings: LaunchConfig) =>
  invoke("play", { settings });

export const stop = async () => invoke("stop");

export const isGameRunning = () => invoke<"NotRunning" | "Running" | { Exited: number }>("is_game_running");

export const getMinecraftDir = () => invoke<string>("get_minecraft_dir");

export const validateMods = (props: { id: string; game_dir?: string, files: FileDownload[] }) => invoke<Array<FileDownload>>("validate_mods", props);