import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { ToastContainer } from "react-toastify";
import ReactDOM from "react-dom/client";
import React, { Suspense } from "react";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

import { masl } from "@auth/msal";

import SelectVersionDialog from "@component/dialog/SelectVersion";
import SelectProfile from "@component/dialog/ProfileSelection";
import { DownloadProvider } from "@context/DownloadContext";
import { queryClient } from "./lib/config/queryClient";
import router from "@/router";
import DB from "./lib/db/db";
import { exit } from "@tauri-apps/api/process";
import { initLogger } from "./lib/system/logger";
import GameCrash from "./components/dialog/GameCrash";

async function init() {
  await initLogger();
  await DB.init();
}

init()
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <MsalProvider instance={masl}>
            <DownloadProvider>
              <RouterProvider router={router} />
              <ToastContainer position="bottom-right" theme="dark" />
              <SelectVersionDialog />
              <GameCrash />
              <ErrorBoundary fallback={<></>}>
                <Suspense fallback={<></>}>
                  <SelectProfile />
                </Suspense>
              </ErrorBoundary>
            </DownloadProvider>
          </MsalProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  })
  .catch(() => exit(1));
