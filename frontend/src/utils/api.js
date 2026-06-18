import axios from 'axios';

// Backend URL — Render deployment
const BASE_URL = import.meta.env.VITE_API_URL
  || 'https://poll-platform-hyo6.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s — Render free tier cold start takes time
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out — backend is waking up, please retry');
    }
    return Promise.reject(error);
  }
);

export default api;
