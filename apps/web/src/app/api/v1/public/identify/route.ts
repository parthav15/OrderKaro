import { NextRequest } from "next/server"
import { error, handleError } from "@/lib/api-utils"

export async function POST(_request: NextRequest) {
  try {
    return error("Phone verification is required. Request a one-time code to continue.", 410)
  } catch (err) {
    return handleError(err)
  }
}
