import type { Response } from "express"

export function success(res: Response, data: unknown = null, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data })
}

export function error(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error: message })
}

export function created(res: Response, data: unknown) {
  return res.status(201).json({ success: true, data })
}
