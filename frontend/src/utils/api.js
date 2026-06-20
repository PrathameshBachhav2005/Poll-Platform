import axios from 'axios';

// In development:  set VITE_API_URL in frontend/.env.local → http://localhost:5001/api
// In production:   set VITE_API_URL in your deployment env → https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 s — prevents hanging requests on slow platforms
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error logging (optional — helps debug deployment issues)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out — is the backend running?');
    }
    return Promise.reject(error);
  }
);

export default api;
