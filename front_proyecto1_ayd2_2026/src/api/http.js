import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

let onUnauthorized = null;
let redirecting = false;

export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401 && !redirecting) {
      redirecting = true;

      localStorage.removeItem("token");
      localStorage.removeItem("session");

      if (onUnauthorized) onUnauthorized();

      // por si se queda “bloqueado” el flag en dev
      setTimeout(() => (redirecting = false), 800);
    }

    return Promise.reject(err);
  }
);

export default http;