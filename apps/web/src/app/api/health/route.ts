import { NextRequest } from "next/server"
import { success } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  return success({ status: "ok", timestamp: new Date().toISOString() })
}
