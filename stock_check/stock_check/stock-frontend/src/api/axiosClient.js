// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('user');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch { }
  }
  return config;
});

export default axiosClient;