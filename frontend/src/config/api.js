import axios from 'axios';

// ─── Centralized API Configuration ──────────────────────────────
// In production (Vercel), requests go to `/api` which the Vercel
// rewrite routes to the serverless function at `/api/index.js`.
// In development, requests go to the local Express server.

const API = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor for unified error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      error.friendlyMessage =
        'Cannot connect to the server. Please ensure the backend is running or check your network connection.';
    }
    return Promise.reject(error);
  }
);

export default API;
