import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { ToastContainer } from "react-toastify";
import { exit } from "@tauri-apps/api/process";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";

import "react-toastify/dist/ReactToastify.css";

import { ModrinthClientApplication } from "@lib/api/modrinth/auth/ModrinthClientApplication";
import { ModrinthProvider } from "./components/providers/ModrinthProvider";
import { DownloadProvider } from "@context/DownloadContext";
import { queryClient } from "./lib/config/queryClient";
import { attachLogger } from "./lib/system/logger";
import { getPCA } from "@auth/msal";
import router from "@/router";
import DB from "./lib/db/db";
import "./index.css";

async function init() {
  await attachLogger();
  await DB.init();

  const modrith = new ModrinthClientApplication();
  const pca = await getPCA();

  return { pca, modrith }
}

/*
//import { ErrorBoundary } from "react-error-boundary";
//import SelectVersionDialog from "@component/dialog/SelectVersion";
//import SelectProfile from "@component/dialog/ProfileSelection";
//import GameCrash from "./components/dialog/GameCrash";
  <SelectVersionDialog />
              <GameCrash />
              <ErrorBoundary fallback={<></>}>
                <Suspense fallback={<></>}>
                  <SelectProfile />
                </Suspense>
              </ErrorBoundary>

*/
init()
  .then(({ pca, modrith }) => {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <MsalProvider instance={pca}>
            <ModrinthProvider client={modrith}>
              <DownloadProvider>
                <RouterProvider router={router} />
              </DownloadProvider>
            </ModrinthProvider>
          </MsalProvider>
        </QueryClientProvider>
        <ToastContainer position="bottom-right" theme="dark" />
      </StrictMode>,
    );
  })
  .catch(() => exit(1));
