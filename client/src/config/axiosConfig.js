/**
 * Axios Configuration for Production
 * 
 * Features:
 * - Relative API path (/api) for Docker compatibility
 * - Automatic token injection in headers
 * - Error handling and logging
 * - Timeout configuration
 * - Request/response interceptors
 */

import axios from 'axios';

/**
 * Create axios instance with production-ready configuration
 * 
 * Development: Uses relative path /api
 * Production: Uses relative path /api (Nginx reverse proxy)
 */
const API = axios.create({
  // Use relative path - works in Docker since Nginx proxies /api to backend
  baseURL: '/api',
  
  // Standard timeouts
  timeout: 30000, // 30 seconds
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },

  // Allow credentials (for cookie-based sessions if needed)
  withCredentials: false
});

/**
 * Request Interceptor
 * Automatically add authentication token to all requests
 */
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle responses, errors, and token expiration
 */
API.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        response.data
      );
    }
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[API Error] ${status}`, data);
      }

      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject({
          status,
          message: 'Authentication failed. Please login again.',
          data
        });
      }

      // Handle 403 Forbidden
      if (status === 403) {
        return Promise.reject({
          status,
          message: 'Access denied. You do not have permission to access this resource.',
          data
        });
      }

      // Handle 404 Not Found
      if (status === 404) {
        return Promise.reject({
          status,
          message: 'Resource not found.',
          data
        });
      }

      // Handle 500+ server errors
      if (status >= 500) {
        return Promise.reject({
          status,
          message: 'Server error. Please try again later.',
          data
        });
      }

      // All other errors
      return Promise.reject({
        status,
        message: data?.error || data?.message || 'An error occurred',
        data
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('[API No Response]', error.request);
      return Promise.reject({
        message: 'No response from server. Please check your connection.',
        error
      });
    } else {
      // Error in request setup
      console.error('[API Setup Error]', error.message);
      return Promise.reject({
        message: error.message || 'An error occurred',
        error
      });
    }
  }
);

export default API;
