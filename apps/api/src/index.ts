import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { createServer } from "http"
import env from "./config/env"
import { initSocket } from "./socket"
import authRoutes from "./modules/auth/auth.routes"
import canteenRoutes from "./modules/canteen/canteen.routes"
import menuRoutes from "./modules/menu/menu.routes"
import tableRoutes from "./modules/table/table.routes"
import orderRoutes from "./modules/order/order.routes"
import walletRoutes from "./modules/wallet/wallet.routes"
import publicRoutes from "./modules/public/public.routes"
import staffRoutes from "./modules/staff/staff.routes"
import analyticsRoutes from "./modules/analytics/analytics.routes"
import announcementRoutes from "./modules/announcement/announcement.routes"
import consumerRoutes from "./modules/consumer/consumer.routes"
import adminRoutes from "./modules/admin/admin.routes"

const app = express()
const httpServer = createServer(app)

initSocket(httpServer)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/api/v1/public", publicRoutes)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/canteens", canteenRoutes)
app.use("/api/v1/canteens", menuRoutes)
app.use("/api/v1/canteens", tableRoutes)
app.use("/api/v1/canteens", staffRoutes)
app.use("/api/v1/canteens", analyticsRoutes)
app.use("/api/v1/canteens", announcementRoutes)
app.use("/api/v1/canteens", orderRoutes)
app.use("/api/v1/consumer", consumerRoutes)
app.use("/api/v1", walletRoutes)
app.use("/api/v1/admin", adminRoutes)

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
)

httpServer.listen(env.PORT, () => {
  console.log(`API server running on port ${env.PORT}`)
})
