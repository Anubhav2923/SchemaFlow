import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};
