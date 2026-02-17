const agentBaseUrl = import.meta.env.VITE_AGENT_BASE_URL || window.location.origin;

export const config = {
  // Base URL for the backend API
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  // Base URL for the agent service (default to port 5001)
  AGENT_BASE_URL: agentBaseUrl,
  // Socket.io URL (strip trailing /api if present to avoid path conflicts)
  SOCKET_URL: agentBaseUrl.replace(/\/api$/, '')
};
