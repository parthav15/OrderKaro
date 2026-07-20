import { io, Socket } from "socket.io-client"
import { useAuthStore } from "@/stores/auth"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || ""

export const realtimeEnabled = SOCKET_URL.length > 0

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
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
  if (realtimeEnabled && !s.connected) {
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
