import { PublicClientApplication, EventType, type AuthenticationResult } from "@azure/msal-browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import ReactDOM from 'react-dom/client';
import localforage from 'localforage';
import React from 'react';

import NotificationProvider from './lib/context/NotificationContext';
import { DownloadProvider } from '@context/DownloadContext';
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from '@/lib/config/auth';
import "@/lib/auth/msal_browser_override";
import router from '@/router';

import 'react-toastify/dist/ReactToastify.css';
import './index.css';

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
        <NotificationProvider>
          <DownloadProvider>
            <RouterProvider router={router} />
            <ToastContainer position="bottom-right" theme="dark" />
          </DownloadProvider>
        </NotificationProvider>
      </MsalProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);