import type { Server as HttpServer } from "http"
import { Server } from "socket.io"
import { verifyAccessToken } from "../utils/jwt"

let io: Server

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error("Authentication required"))
    }
    try {
      const payload = verifyAccessToken(token)
      socket.data.user = payload
      next()
    } catch {
      next(new Error("Invalid token"))
    }
  })

  io.on("connection", (socket) => {
    const user = socket.data.user

    if (
      user.canteenId &&
      (user.role === "KITCHEN" || user.role === "MANAGER" || user.role === "OWNER")
    ) {
      socket.join(`canteen:${user.canteenId}:kitchen`)
    }

    if (
      user.canteenId &&
      (user.role === "COUNTER" || user.role === "MANAGER" || user.role === "OWNER")
    ) {
      socket.join(`canteen:${user.canteenId}:counter`)
    }

    socket.on("order:subscribe", (orderId: string) => {
      socket.join(`order:${orderId}`)
    })

    socket.on("order:unsubscribe", (orderId: string) => {
      socket.leave(`order:${orderId}`)
    })

    socket.on("disconnect", () => {})
  })

  return io
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized")
  }
  return io
}
