import axios from 'axios';

// Centralized API configuration for backend services
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
