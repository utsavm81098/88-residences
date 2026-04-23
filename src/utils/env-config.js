export const ENV_CONFIG = {
  ENVIRONMENT: import.meta.env.VITE_APP_ENV || 'development',
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  PORT: import.meta.env.VITE_PORT || 3000,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
};
