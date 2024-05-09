import type { InvokeArgs } from "@tauri-apps/api/tauri";
import { invoke, } from "@tauri-apps/api";
import { z } from 'zod';
import type { FileDownload } from "../api/modrinth";
import type { LaunchConfig } from "./launch_config";

type CurrentGameState = "NotRunning" | "Running" | { Exited: number };
type Version = { version: string; game_dir?: string; };
type ModInstall = {
  profile_id: string;
  files: FileDownload[],
  game_dir?: string;
}
type PackInstall = {
  source: FileDownload,
  type: "Resource" | "Shader",
  game_dir?: string,
}
type ModPackInstall = {
  game_dir?: string;
  profile_id: string;
}

type ValidatePackFileArgs = {}
type ValidateModPackArgs = {}
type ValidateModsArgs = {}

const commands = {
  "start_auth_server": null,
  "close_auth_server": z.object({ port: z.number().positive() }),

  "play": z.object({}),
  "stop": null,
  "is_game_running": null,
  "get_minecraft_dir": null,

  "validate_game_files": z.object({ version: z.string(), game_dir: z.string().optional() }),
  "validate_mods_files": z.object({}),
  "validate_pack_files": z.object({}),
  "validate_modpack_files": z.object({}),

  "install_game": z.object({ version: z.string(), game_dir: z.string().optional() }),
  "install_pack": z.object({
    source: z.object({}),
    type: z.enum(["Resource", "Shader"]),
    game_dir: z.string().optional()
  }),
  "install_mods": z.object({}),
  "install_modpack": z.object({})
}

const runInvoke = async <T = void>(command: keyof typeof commands, args: InvokeArgs | undefined) => {
  const schema = commands[command];
  if (!schema) {
    return invoke<T>(command, args);
  }
  const data = schema.parse(args);
  return invoke<T>(command, data);
}

export const closeAuthServer = async (port: number) => runInvoke("close_auth_server", { port });
export const startAuthServer = () => runInvoke<number>("start_auth_server", undefined);

export const startGame = (settings: LaunchConfig) => runInvoke("play", settings);
export const stopGame = () => runInvoke("stop", undefined);
export const isGameRunning = () => runInvoke<CurrentGameState>("is_game_running", undefined);
export const getDefaultMinecraftDirectory = () => runInvoke<string>("get_minecraft_dir", undefined);

export const validateGameFiles = (args: Version) => runInvoke<boolean>("validate_game_files", args);
export const validatePackFiles = (args: ValidatePackFileArgs) => runInvoke<boolean>("validate_pack_files", args);
export const validateModsFiles = (args: ValidateModsArgs) => runInvoke<boolean>("validate_mods_files", args);
export const validateModPackFiles = (args: ValidateModPackArgs) => runInvoke<boolean>("validate_modpack_files", args);

export const installGame = (args: Version) => runInvoke("install_game", args);
export const installPack = (args: PackInstall) => runInvoke("install_pack", args);
export const installMods = (args: ModInstall) => runInvoke("install_mods", args);
export const installModPack = (args: ModPackInstall) => runInvoke("install_modpack", args);
