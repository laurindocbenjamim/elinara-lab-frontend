export const config = {
  // Base URL for the backend API
  // In production, this can be set via VITE_API_BASE_URL environment variable
  // If not set, it defaults to '/api/v1' which works with the Nginx proxy
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  AGENT_BASE_URL: import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:5001/api',
};
