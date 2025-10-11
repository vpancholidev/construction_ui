import axios from 'axios';
import { logoutUser } from './authHelper';
const axiosInstance = axios.create({
  baseURL: 'https://localhost:7047/api', // 🔁 Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
// ✅ Add request interceptor to attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // or whatever your API expects
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logoutUser(); // Clear localStorage and reload
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
