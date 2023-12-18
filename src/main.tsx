import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { ToastContainer } from 'react-toastify';
import ReactDOM from 'react-dom/client';
import React from 'react';

import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import "./lib/polyfill/to-reversed";
import { masl } from "@auth/msal";

import NotificationProvider from '@lib/context/NotificationContext';
import { DownloadProvider } from '@context/DownloadContext';

import router from '@/router';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MsalProvider instance={masl}>
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