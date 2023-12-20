import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { ToastContainer } from "react-toastify";
import ReactDOM from "react-dom/client";
import React, { Suspense } from "react";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

import "./lib/polyfill/to-reversed";
import { masl } from "@auth/msal";

import SelectVersionDialog from "@component/dialog/SelectVersion";
import SelectProfile from "@component/dialog/ProfileSelection";
import { DownloadProvider } from "@context/DownloadContext";

import router from "@/router";
import { ErrorBoundary } from "react-error-boundary";
import { init } from "./lib/db/initDb";

const queryClient = new QueryClient();

init().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <MsalProvider instance={masl}>
          <DownloadProvider>
            <RouterProvider router={router} />
            <ToastContainer position="bottom-right" theme="dark" />
            <SelectVersionDialog />
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
});
