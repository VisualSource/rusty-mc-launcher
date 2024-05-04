import { type UnlistenFn, listen } from "@tauri-apps/api/event";
import Queue, { QueueEvent, type QueueWorker } from "queue";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  validateGameFiles,
  installGame,
  validateModsFiles,
  installMods,
  installPack,
} from "@system/commands";
import modrinth, { type FileDownload } from "../api/modrinth";
import useExternalQueue from "@hook/useExternalQueue";
import { getLoaderType } from "@/utils/versionUtils";
import type ToastData from "@/types/toastData";
import { queueFactory } from "@/utils/queue";
import profiles from "../models/profiles";
import logger from "@system/logger";

export type ModsMetadata = {
  type: "mods";
  mods: FileDownload[];
  profile: string;
  game_dir: string | null;
};
export type ClientMetadata = {
  type: "client";
  game_dir: string | undefined;
  version: string;
};

export type PackMetadata = {
  type: "pack";
  name: string;
  game_dir?: string | undefined;
  file: FileDownload;
  requiredMods: boolean;
  packType: "resource" | "shader";
};

export type ModsValidationMetadata = {
  type: "mods_validation";
  game_dir?: string;
  id: string;
  files: FileDownload[];
};

export type QueueItem = {
  ammount: number;
  ammount_current: number;
  size: number;
  size_current: number;
  type: "client" | "mods" | "pack" | "mods_validation";
  msg: string;
  download: DownloadEvent | null;
  key: `${string}-${string}-${string}-${string}-${string}`;
  metadata:
  | ModsMetadata
  | ClientMetadata
  | PackMetadata
  | ModsValidationMetadata;
};

type FetchEvent = {
  msg: string;
  ammount: number;
  size: number;
};

type StartEvent = {
  key: string;
  msg: string;
};

type DownloadEvent = {
  file: string;
  size: number;
};

type DownloadClient = {
  queueCurrent: QueueItem | undefined;
  queueNext: QueueItem[];
  queueCompleted: QueueItem[];
  queueErrored: QueueItem[];
  clearCompleted: () => void;
  clearErrored: () => void;
  validateMods: (id: string) => Promise<void>;
  install: (
    version: string,
    game_dir?: string,
    forceDownload?: boolean,
  ) => Promise<void>;
  installMods: (
    profileId: string,
    modIds: string[],
    version: { game: string; loader: string },
  ) => Promise<void>;
  installPack: (packId: string, type: "resource" | "shader") => Promise<void>;
};

class QueueError extends Error {
  constructor(
    error: Error,
    public metadata?: QueueItem,
  ) {
    super(error.message, { cause: error.cause });
    this.stack = error.stack;
  }
}

/// 1. load queue info from localstorage
/// 2. proccess queue
/// 3. on shunt download save to localstorage

export const DownloadContext = createContext<DownloadClient | null>(null);

const install_queue = new Queue();
install_queue.autostart = true;
install_queue.concurrency = 1;

const queues = {
  next: queueFactory<QueueItem>(),
  completed: queueFactory<QueueItem>(),
  errored: queueFactory<QueueItem>(),
};

export const DownloadProvider = ({ children }: React.PropsWithChildren) => {
  const queueCompleted = useExternalQueue<QueueItem>(queues.completed);
  const queueErrored = useExternalQueue<QueueItem>(queues.errored);
  const queueNext = useExternalQueue<QueueItem>(queues.next);
  const [currentItem, setCurrentItem] = useState<QueueItem | undefined>();

  useEffect(() => {
    const successHandler = (
      job: QueueEvent<"success", { result: unknown[] }>,
    ) => {
      const metadata = job.detail.result[0] as QueueItem;

      setCurrentItem(undefined);

      queues.completed.queue.enqueue(metadata);

      const message =
        metadata.type === "client"
          ? "Minecraft has been installed."
          : metadata.type === "pack"
            ? "Minecraft pack has been installed."
            : "Minecraft mods have been downloaded.";

      toast.success(message);
    };
    const errorHandler = (
      job: QueueEvent<"error", { error: QueueError; job: QueueWorker }>,
    ) => {
      const error = job.detail.error;
      logger.error(error);

      if (error.metadata) queues.errored.queue.enqueue(error.metadata);
    };

    let lisenter: UnlistenFn;
    listen<{
      event: "fetch" | "download" | "complete" | "end" | "start";
      value: string;
    }>("rmcl:://download", (ev) => {
      setTimeout(() => {
        try {
          const data = JSON.parse(ev.payload.value);
          switch (ev.payload.event) {
            case "fetch": {
              setCurrentItem((current) => {
                if (!current) return current;
                return {
                  ...current,
                  ...(data as FetchEvent),
                  size_current: 0,
                  ammount_current: 0,
                };
              });
              break;
            }
            case "download": {
              setCurrentItem((current) => {
                if (!current) return current;
                return {
                  ...current,
                  size_current:
                    current.size_current + (data as DownloadEvent).size,
                  ammount_current: current.ammount_current + 1,
                  download: data as DownloadEvent,
                };
              });
              break;
            }
            case "start":
            case "end": {
              setCurrentItem((current) => {
                if (!current) return current;
                return {
                  ...current,
                  msg: (data as StartEvent).msg,
                };
              });
            }
            case "complete": {
            }
          }
        } catch (error) {
          logger.error(error, ev);
        }
      }, 1000);
    }).then((value) => {
      lisenter = value;
    });

    install_queue.addEventListener("success", successHandler);
    install_queue.addEventListener("error", errorHandler);

    return () => {
      install_queue.removeEventListener("success", successHandler);
      install_queue.removeEventListener("error", errorHandler);
      if (lisenter) lisenter();
    };
  }, []);

  return (
    <DownloadContext.Provider
      value={{
        queueCurrent: currentItem,
        queueCompleted,
        queueErrored,
        queueNext,
        clearErrored() {
          queues.errored.queue.clear();
        },
        clearCompleted() {
          queues.completed.queue.clear();
        },
        async validateMods(id: string) {
          try {
            const queue_id = crypto.randomUUID();
            const profile = await profiles.findOne({ where: [{ id }] });

            if (!profile) throw new Error("No Profile was found.");

            if (profile.mods === null) {
              return;
            }

            queues.next.queue.enqueue({
              ammount: 0,
              ammount_current: 0,
              download: null,
              key: queue_id,
              size_current: 0,
              msg: "Starting Mods Validation",
              size: 0,
              type: "mods_validation",
              metadata: {
                type: "mods_validation",
                files: profile.mods,
                id,
              },
            });

            install_queue.push(async (cb) => {
              if (!cb)
                throw new Error("Callback handler not avaliable", {
                  cause: "NO_CALLBACK_HANDLER",
                });
              const data = queues.next.queue.dequeueItem(id);
              try {
                if (!data)
                  throw new Error("Failed to get queue data", {
                    cause: "MISSING_QUEUE_METADATA",
                  });
                if (data.metadata.type !== "mods_validation")
                  throw new Error("Unable to process, non pack metadata");

                setCurrentItem(data);

                await validateModsFiles({
                  id: data.metadata.id,
                  files: data.metadata.files,
                  game_dir: data.metadata.game_dir,
                });

                cb(undefined, data);
              } catch (error) {
                logger.error(error);
                cb(new QueueError(error as Error, data));
              }
            });
          } catch (error) {
            logger.error(error);
            toast.error(
              (error as Error)?.message ?? `Failed to validate profile.`,
              {
                data: {},
              },
            );
          }
        },

        async installPack(packId, type) {
          try {
            const file = await modrinth.GetPackFile(packId);
            const id = crypto.randomUUID();

            queues.next.queue.enqueue({
              ammount: 1,
              ammount_current: 0,
              download: null,
              key: id,
              msg: `Install ${type} pack`,
              size: file.download.size,
              size_current: 0,
              type: "pack",
              metadata: {
                type: "pack",
                name: file.name,
                file,
                packType: type,
                requiredMods: false,
              },
            });

            install_queue.push(async (cb) => {
              if (!cb)
                throw new Error("Callback handler not avaliable", {
                  cause: "NO_CALLBACK_HANDLER",
                });

              const data = queues.next.queue.dequeueItem(id);

              try {
                if (!data)
                  throw new Error("Failed to get queue data", {
                    cause: "MISSING_QUEUE_METADATA",
                  });
                if (data.metadata.type !== "pack")
                  throw new Error("Unable to process, non pack metadata");

                setCurrentItem(data);

                await installPack({
                  source: data.metadata.file,
                  game_dir: data.metadata.game_dir,
                  type: data.metadata.packType.replace(/^\w/, (c) =>
                    c.toUpperCase(),
                  ) as "Resource" | "Shader",
                });

                cb(undefined, data);
              } catch (error) {
                logger.error(error);
                cb(new QueueError(error as Error, data));
              }
            });
          } catch (error) {
            logger.error(error);
            toast.error(
              (error as Error)?.message ?? `Failed to download ${type} pack.`,
              {
                data: {
                  time: new Date(),
                },
              },
            );
          }
        },
        async install(version, game_dir, forceDownload) {
          try {
            const isInstalled = await validateGameFiles({ version, game_dir });

            if (isInstalled && !forceDownload) {
              window.dispatchEvent(
                new CustomEvent("mcl::install_ready", {
                  detail: { vaild: true },
                }),
              );
              return;
            }

            const id = crypto.randomUUID();

            queues.next.queue.enqueue({
              ammount: 0,
              ammount_current: 0,
              download: null,
              key: id,
              msg: "Install Client",
              size: 0,
              size_current: 0,
              type: "client",
              metadata: {
                type: "client",
                game_dir: game_dir,
                version,
              },
            });

            install_queue.push(async (cb) => {
              if (!cb)
                throw new Error("Callback handler not avaliable", {
                  cause: "NO_CALLBACK_HANDLER",
                });

              const data = queues.next.queue.dequeueItem(id);

              try {
                if (!data)
                  throw new Error("Failed to get queue data", {
                    cause: "MISSING_QUEUE_METADATA",
                  });
                if (data.metadata.type !== "client")
                  throw new Error("Unable to process, non client metadata");

                setCurrentItem(data);

                await installGame(data.metadata);

                document.dispatchEvent(
                  new CustomEvent("mcl::install_ready", {
                    detail: { vaild: true },
                  }),
                );

                cb(undefined, data);
              } catch (error) {
                document.dispatchEvent(
                  new CustomEvent("mcl::install_ready", {
                    detail: { vaild: false },
                  }),
                );
                cb(new QueueError(error as Error, data));
              }
            });
          } catch (error) {
            logger.error(error);
            toast.error<{ title: string }>(
              (error as Error)?.message ?? "Failed to install client",
              {
                data: {
                  title: "Failed to install client",
                  //time: new Date(),
                },
              },
            );
            document.dispatchEvent(
              new CustomEvent("mcl::install_ready", {
                detail: { vaild: false },
              }),
            );
          }
        },
        async installMods(profileId, modIds, version) {
          try {
            const selectedProfile = await profiles.findOne({
              where: [{ id: profileId }],
            });
            if (!selectedProfile)
              throw new Error("Failed to find profile", {
                cause: "FAILED_FIND_PROFILE",
              });

            const loader = getLoaderType(selectedProfile.lastVersionId);
            if (loader.type === "vanilla")
              throw new Error("Unable to install mod on given profile.", {
                cause: "NONMODDED_PROFILE",
              });

            const files = await Promise.allSettled(
              modIds.map(async (mod) => {
                return modrinth
                  .GetVersionFiles(mod, loader.type, loader.game)
                  .catch(() => {
                    return modrinth.GetVersionFiles(
                      mod,
                      loader.type,
                      version.game,
                    );
                  })
                  .then((value) => value.flat(1));
              }),
            );

            const content: FileDownload[] = [];

            for (const item of files) {
              if (item.status === "fulfilled") {
                content.push(...item.value);
                continue;
              }

              throw new Error(
                "Failed to install mod: No Valid version avalible",
                { cause: "NO_VALID_VERSION_FOUND" },
              );
            }

            const installedModsIds = (selectedProfile.mods ?? []).map(
              (value) => value.id,
            );
            const newlyAddedMods = content.filter(
              (item) => !installedModsIds.includes(item.id),
            );

            // there are not new mods to download!
            if (!newlyAddedMods.length) {
              toast.success<ToastData>("Mods already installed on profile.", {
                data: {
                  //time: new Date(),
                  event: "install",
                  type: "mods",
                },
              });
              return;
            }

            await profiles.update({
              where: [{ id: selectedProfile.id }],
              data: {
                mods: (selectedProfile.mods ?? []).concat(newlyAddedMods),
              },
            });

            const size = newlyAddedMods.reduce(
              (pre, curr) => pre + curr.download.size,
              0,
            );
            const id = crypto.randomUUID();

            queues.next.queue.enqueue({
              ammount: files.length,
              ammount_current: 0,
              download: null,
              key: id,
              msg: "Installing Mods",
              size: size,
              size_current: 0,
              type: "mods",
              metadata: {
                type: "mods",
                profile: selectedProfile.id,
                mods: newlyAddedMods,
                game_dir: selectedProfile.gameDir,
              },
            });

            install_queue.push(async (cb) => {
              if (!cb)
                throw new Error("Callback handler not avaliable", {
                  cause: "NO_CALLBACK_HANDLER",
                });
              const data = queues.next.queue.dequeueItem(id);
              try {
                if (!data)
                  throw new Error("Failed to get queue data", {
                    cause: "MISSING_QUEUE_METADATA",
                  });
                if (data.metadata.type !== "mods")
                  throw new Error("Unable to process, non mod metadata");
                setCurrentItem(data);

                await installMods({
                  files: data.metadata.mods,
                  profile_id: data.metadata.profile, game_dir:
                    data.metadata.game_dir ?? undefined
                });

                cb(undefined, data);
              } catch (error) {
                cb(new QueueError(error as Error));
              }
            });
          } catch (error) {
            logger.error(error);
            toast.error<ToastData>(
              (error as Error)?.message ?? "Failed to download mods.",
              {
                data: {
                  //time: new Date(),
                  event: "install-error",
                  type: "mods",
                },
              },
            );
          }
        },
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
};
