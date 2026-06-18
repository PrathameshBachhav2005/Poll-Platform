import axios from 'axios';

// Production backend URL (Vercel)
const BASE_URL = import.meta.env.VITE_API_URL
  || 'https://poll-platform-backend.vercel.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
      console.error('Request timed out — backend not responding');
    }
    return Promise.reject(error);
  }
);

export default api;
