import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify'
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { RecoilRoot } from 'recoil';
import { BrowserRouter } from "react-router-dom";
import App from './pages/App';
import { UserProvider } from './components/account/Account';
import reportWebVitals from './reportWebVitals';
import "./styles/global.sass";
import DB from './lib/db';


const update_check = window.localStorage.getItem("update_check");

if(!update_check || update_check !== "V1.9") {
    console.log("Update Check");
    DB.Get().Clear();
    window.localStorage.clear();
    window.localStorage.setItem("update_check","V1.9");
}

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
          <ReactQueryDevtools initialIsOpen={false}/>
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
    <ToastContainer position="bottom-right" draggable={false} theme="dark"/>
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
