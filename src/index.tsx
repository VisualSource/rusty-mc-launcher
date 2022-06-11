import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from 'react-query'
import { RecoilRoot } from 'recoil';
import { BrowserRouter } from "react-router-dom";
import App from './pages/App';
import { UserProvider } from './components/account/Account';
import reportWebVitals from './reportWebVitals';
import "./styles/global.sass";

import { ReactQueryDevtools } from 'react-query/devtools'

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <App />
          </UserProvider>
          {process.env.NODE_ENV === "development" ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
    <ToastContainer position="bottom-right" draggable={false} theme="dark"/>
  </React.StrictMode>
);

if(process.env.NODE_ENV === "development"){
    const devtools = document.createElement("script");
    devtools.setAttribute("src","http://localhost:8097");
    devtools.setAttribute("data-react-devtools",React.version);
    document.body.appendChild(devtools);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
