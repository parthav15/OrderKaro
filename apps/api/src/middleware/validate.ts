import type { Request, Response, NextFunction } from "express"
import type { ZodSchema } from "zod"
import { error } from "../utils/response"

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const messages = result.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      )
      return error(res, messages.join(", "), 422)
    }
    req.body = result.data
    next()
  }
}
