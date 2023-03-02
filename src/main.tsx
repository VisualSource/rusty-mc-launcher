import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicClientApplication, EventType, type AuthenticationResult } from "@azure/msal-browser";
import DownloadManager from "@/lib/system/Download";
import { DownloadProvider } from '@context/DownloadContext';
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from '@/lib/config/auth';
import { initStorage } from './lib/config/storage';
import router from '@/router';
import './index.css'
import localforage from 'localforage';

initStorage();

const queryClient = new QueryClient();
const msalInstance = new PublicClientApplication(msalConfig);
const downloadClient = DownloadManager.getInstance();

const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((ev) => {
  switch (ev.eventType) {
    case EventType.LOGIN_SUCCESS: {
      if (!ev.payload) return;
      const payload = ev.payload as AuthenticationResult;
      const account = payload.account;
      msalInstance.setActiveAccount(account);

      break;
    }
    case EventType.LOGOUT_SUCCESS: {
      localforage.clear();
    }
    default:
      break;
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MsalProvider instance={msalInstance}>
        <DownloadProvider client={downloadClient}>
          <RouterProvider router={router} />
        </DownloadProvider>
      </MsalProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);