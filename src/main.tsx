import React from 'react';
import localforage from 'localforage';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicClientApplication, EventType, type AuthenticationResult } from "@azure/msal-browser";
import { DownloadProvider } from '@context/DownloadContext';
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from '@/lib/config/auth';
import router from '@/router';
import "@/lib/auth/msal_browser_override";
import './index.css';
import Notification from '@system/Notification';

const notify = new Notification();
const queryClient = new QueryClient();
const msalInstance = new PublicClientApplication(msalConfig);

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
        <DownloadProvider>
          <RouterProvider router={router} />
        </DownloadProvider>
      </MsalProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);