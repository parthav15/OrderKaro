import { io, Socket } from "socket.io-client"
import { useAuthStore } from "@/stores/auth"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.EXPO_PUBLIC_SOCKET_URL || "https://order-karo-frontend.vercel.app", {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token: useAuthStore.getState().accessToken,
      },
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  s.auth = { token: useAuthStore.getState().accessToken }
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
