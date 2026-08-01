import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const errorMessage = (error) =>
  error.response?.data?.message || "Something went wrong. Please try again.";

const SEARCH_STATE_KEY = (token) => `search_state_${token || "guest"}`;

const saveSearchState = (state) => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    localStorage.setItem(SEARCH_STATE_KEY(token), JSON.stringify(state));
  } catch (_) {}
};

const loadSearchState = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const raw = localStorage.getItem(SEARCH_STATE_KEY(token));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const clearAllSearchStates = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("search_state_"))
      .forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
};

const decodeJwtEmail = () => {
  const token = localStorage.getItem("token");
  if (!token) return "";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decoded.sub || "";
  } catch (_) {
    return "";
  }
};

export {
  api,
  errorMessage,
  saveSearchState,
  loadSearchState,
  clearAllSearchStates,
  decodeJwtEmail,
};
