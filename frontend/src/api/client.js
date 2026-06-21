import axios from 'axios';

/**
 * Configured axios instance.
 * Base URL is read from VITE_API_BASE_URL at build/dev time.
 * All API calls should use this instance — never create ad-hoc axios calls.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor — normalize error shape
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject({ ...error, friendlyMessage: message });
  }
);

export default client;
