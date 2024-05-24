import { type UnlistenFn, listen } from "@tauri-apps/api/event";
import { createContext, useSyncExternalStore } from "react";
import logger from "@system/logger";

type Progress = {
  message: string;
  max_progress: number;
  progress: number;

  file: string;
}

class DownloadManager extends EventTarget {
  private unsubscribe: Promise<UnlistenFn>;
  private current_progress: null | Progress = null;

  constructor() {
    super();
    this.unsubscribe = listen<{ event: "group" | "update", value: string }>("rmcl://download", (ev) => {
      const data = JSON.parse(ev.payload.value) as Record<string, unknown>;

      switch (ev.payload.event) {
        case "group":
          this.current_progress = {
            message: data["message"] as string ?? "",
            progress: data["progress"] as number ?? 0,
            max_progress: data["max_progress"] as number ?? 0,
            file: data["file"] as string ?? ""
          };
          break;
        case "update": {
          if (!this.current_progress) break;
          this.current_progress.message = data["message"] as string ?? this.current_progress.message;
          this.current_progress.progress = this.current_progress.progress + (data["progress"] as number ?? 0);
          this.current_progress.file = data["file"] as string ?? this.current_progress.file;
          break;
        }
      }
      this.dispatchEvent(new Event("update"))
    });
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
  download_manager.addEventListener("update", callback);
  return () => {
    download_manager.removeEventListener("update", callback);
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
