import axios from "axios";
import { getAuth } from "firebase/auth";

const api = axios.create({
  baseURL: "/api", // Relative URL — works everywhere with proxy in dev
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken(true);
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;