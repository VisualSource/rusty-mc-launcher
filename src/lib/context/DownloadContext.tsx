import { type UnlistenFn, listen } from "@tauri-apps/api/event";
import Queue, { QueueEvent, type QueueWorker } from "queue";
import { createContext, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "react-toastify";

/*import {
  validateGameFiles,
  installGame,
  validateModsFiles,
  installMods,
  installPack,
} from "@system/commands";*/
//import modrinth, { type FileDownload } from "../api/modrinth";
import useExternalQueue from "@hook/useExternalQueue";
import { getLoaderType } from "@/utils/versionUtils";
//import type ToastData from "@/types/toastData";
import { queueFactory } from "@/utils/queue";
import { profile } from "../models/profiles";
import logger from "@system/logger";

import Worker from "./DownloadWorker?worker"

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

type Progress = {
  message: string;
  amount: number,
  current_ammount: number;
  size: number;
  file: string;
}

class DownloadManager extends EventTarget {
  //unsubscribe: Promise<UnlistenFn>;

  current_progress: null | Progress = null;

  worker: Worker;

  constructor() {
    super();

    this.worker = new Worker({ name: "Queue Processer" });

    this.worker.onmessage = (ev) => console.log(ev);

    // this.unsubscribe = listen("rmcl://download", (ev) => { });
  }

  public getSnapshot = () => {
    return this.current_progress;
  }
}



/// 1. load queue info from localstorage
/// 2. proccess queue
/// 3. on shunt download save to localstorage

export const DownloadContext = createContext<{ progress: Progress | null } | null>(null);

const download_manager = new DownloadManager();

function subscribe(callback: () => void) {
  download_manager.addEventListener("event", callback);
  return () => {
    download_manager.removeEventListener("event", callback);
  }
}

export const DownloadProvider = ({ children }: React.PropsWithChildren) => {
  const progress = useSyncExternalStore(subscribe, download_manager.getSnapshot)

  return (
    <DownloadContext.Provider value={{ progress }}>
      {children}
    </DownloadContext.Provider>
  );
};
