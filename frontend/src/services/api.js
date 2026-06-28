const API_BASE = import.meta.env.VITE_API_BASE || "https://knowledgeos-5ee1.onrender.com";

/**
 * Helper to perform HTTP fetch operations with standardized error handling and headers.
 */
async function apiFetch(endpoint, options = {}, token = "") {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    ...options.headers,
  };

  // Automatically add authorization header if token is provided
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set default content type to JSON unless it's a FormData object (e.g. for uploads)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "An error occurred during the API request.");
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    signup: (name, email, password) =>
      apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    getProfile: (token) =>
      apiFetch("/auth/profile", { method: "GET" }, token),
  },

  // Organizations
  organizations: {
    list: (token) =>
      apiFetch("/organizations", { method: "GET" }, token),
    create: (name, token) =>
      apiFetch("/organizations", {
        method: "POST",
        body: JSON.stringify({ name }),
      }, token),
    delete: (orgId, token) =>
      apiFetch(`/organizations/${orgId}`, { method: "DELETE" }, token),
  },

  // Workspaces
  workspaces: {
    list: (orgId, token) =>
      apiFetch(`/organizations/${orgId}/workspaces`, { method: "GET" }, token),
    create: (orgId, name, description, token) =>
      apiFetch(`/organizations/${orgId}/workspaces`, {
        method: "POST",
        body: JSON.stringify({ name, description }),
      }, token),
    delete: (workspaceId, token) =>
      apiFetch(`/workspaces/${workspaceId}`, { method: "DELETE" }, token),
  },

  // Documents
  documents: {
    list: (workspaceId, token) =>
      apiFetch(`/workspaces/${workspaceId}/documents`, { method: "GET" }, token),
    upload: (workspaceId, file, token) => {
      const formData = new FormData();
      formData.append("document", file);
      return apiFetch(`/workspaces/${workspaceId}/documents`, {
        method: "POST",
        body: formData,
      }, token);
    },
    delete: (docId, token) =>
      apiFetch(`/documents/${docId}`, { method: "DELETE" }, token),
    process: (docId, token) =>
      apiFetch(`/documents/${docId}/process`, { method: "POST" }, token),
  },

  // Document Chat
  chat: {
    getHistory: (docId, token) =>
      apiFetch(`/documents/${docId}/chat`, { method: "GET" }, token),
    sendMessage: (docId, question, token) =>
      apiFetch(`/documents/${docId}/chat`, {
        method: "POST",
        body: JSON.stringify({ question }),
      }, token),
  },

  // Dashboard Metrics
  dashboard: {
    getStats: (token) =>
      apiFetch("/dashboard", { method: "GET" }, token),
  },
};
