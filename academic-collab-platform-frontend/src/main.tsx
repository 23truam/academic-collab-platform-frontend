import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/animations.css';
import App from './App';
import axios from 'axios';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

// 全局axios请求拦截器，自动加Bearer token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// 删除自动清理token和user的beforeunload事件，让token持久化
// window.addEventListener('beforeunload', () => {
//   localStorage.removeItem('token');
//   localStorage.removeItem('user');
// });