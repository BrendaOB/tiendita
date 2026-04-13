import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal
  ? 'http://localhost:8000/api'
  : 'https://darkturquoise-hedgehog-191538.hostingersite.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Permitir envío de Cookies si CORS es restringido a origen especifico
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en " + (error.config?.method?.toUpperCase() || 'UNKNOWN') + " " + (error.config?.url || 'UNKNOWN') + ":", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
