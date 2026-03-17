import { useEffect, useRef } from "react"
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket"
import { useAuthStore } from "@/stores/auth"
import { Socket } from "socket.io-client"

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!accessToken) return

    socketRef.current = connectSocket()

    return () => {
      disconnectSocket()
      socketRef.current = null
    }
  }, [accessToken])

  return socketRef.current
}
