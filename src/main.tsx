import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicClientApplication, EventType, type AuthenticationResult } from "@azure/msal-browser";
import DownloadManager from "@/lib/system/Download";
import { DownloadProvider } from '@context/DownloadContext';
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from '@auth/config';
import router from '@/router';
import './index.css';

const queryClient = new QueryClient();
const msalInstance = new PublicClientApplication(msalConfig);
const downloadClient = DownloadManager.getInstance();

const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((ev) => {
  if (ev.eventType === EventType.LOGIN_SUCCESS && ev.payload) {
    const payload = ev.payload as AuthenticationResult;
    const account = payload.account;
    msalInstance.setActiveAccount(account);
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
)
