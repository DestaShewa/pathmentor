// this file stores backend url, authomaticallt sends token, handles error in one place
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔑 Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🚪 Handle unauthorized responses (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      
      // Use window.location for a hard redirect if not in a React context
      // but usually this will be caught by the interceptor during a request
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth?session=expired";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
