import axios from "axios"
import { useAuthStore } from "@/stores/auth"

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "https://order-karo-frontend.vercel.app",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default api
