/**
 * Backend API Configuration
 * 
 * This file centralizes the backend URL configuration.
 * Set VITE_API_URL in your .env file to point to your backend deployment.
 * 
 * For local development: http://localhost:5000
 * For production: https://your-backend.koyeb.app
 */

/**
 * Backend URL - The base URL of your backend API
 * 
 * This variable stores the backend URL from the environment variable.
 * If not set, defaults to empty string (uses relative paths for same-origin).
 * 
 * Usage:
 *   import { BACKEND_URL } from '@/config/api';
 *   const fullUrl = `${BACKEND_URL}/api/products`;
 */
 export const BACKEND_URL =  'https://advisory-mireille-start-up-122s-37de736c.koyeb.app';
// export const BACKEND_URL =  'http://localhost:5000';

/**
 * API Base URL - Alias for BACKEND_URL (for backward compatibility)
 * @deprecated Use BACKEND_URL instead
 */
export const API_BASE_URL = BACKEND_URL;

/**
 * Get the full API URL by prepending the base URL if provided
 * @param path - API endpoint path (e.g., '/api/products')
 * @returns Full URL or relative path
 */
export function getApiUrl(path: string): string {
  if (BACKEND_URL && !path.startsWith('http')) {
    // Remove trailing slash from base URL and leading slash from path
    const base = BACKEND_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }
  return path;
}

/**
 * Check if we're in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Log the current API configuration (useful for debugging)
 */
if (isDevelopment) {
  console.log('Backend API Configuration:', {
    BACKEND_URL: BACKEND_URL || '(not set - using relative paths)',
    isDevelopment,
  });
}

