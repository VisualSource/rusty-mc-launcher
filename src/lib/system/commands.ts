import { invoke } from "@tauri-apps/api";
import { z } from "zod";

export const closeAuthServer = (port: number) =>
  invoke<void>("close_auth_server", { port });
export const startAuthServer = () => invoke<number>("start_auth_server");

type Query<S> = {
  query: string;
  args?: unknown[];
  schema: S;
};

export const db = {
  select: async <S extends z.Schema<any, any>>({
    query,
    args = [],
    schema,
  }: Query<S>) => {
    const request = await invoke<unknown[]>("select", { query, args });
    return request.map((value) => schema.parse(value)) as z.infer<S>[];
  },
  execute: async ({ query, args = [] }: { query: string; args?: unknown[] }) =>
    invoke("execute", { query, args }),
};

const uuidSchema = z.string().uuid();
export const isRunning = (profile: string) =>
  invoke<boolean>("is_running", { profile: uuidSchema.parse(profile) });
export const stop = (profile: string) =>
  invoke("stop", { profile: uuidSchema.parse(profile) });

const launchSchema = z.object({
  auth_player_name: z.string(),
  auth_uuid: z.string(),
  auth_access_token: z.string(),
  auth_xuid: z.string(),

  profile_id: uuidSchema,
});

export type LaunchConfig = z.infer<typeof launchSchema>;

export const launchGame = (config: LaunchConfig) =>
  invoke("launch_game", { config: launchSchema.parse(config) });

export const loaderSchema = z.enum(["vanilla", "forge", "fabric", "quilt"]);
export type Loader = z.infer<typeof loaderSchema>;

const installWorkshopContentSchema = z.object({
  content_type: z.enum(["resource", "shader", "mod", "modpack"]),
  profile: z.string().optional().nullable(),
  file: z.object({
    sha1: z.string(),
    url: z.string(),
    size: z.string(),
  }),
});
export type InstallContentConfig = z.infer<typeof installWorkshopContentSchema>;
export const installWorkshopContent = (config: InstallContentConfig) =>
  invoke("install_workshop_content", {
    config: installWorkshopContentSchema.parse(config),
  });

export const installLocalMrPack = (source: string) =>
  invoke("install_local_mrpack", { file_path: source });

export const showInFolder = (path: string) =>
  invoke("show_in_folder", { path });

export const deleteProfile = (profile: string) =>
  invoke("delete_profile", { profile });
export const createProfile = (profile: string) =>
  invoke("create_profile", { profile });
