import type {
  ORDER_STATUSES,
  STAFF_ROLES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  CUSTOMIZATION_TYPES,
} from "./constants"

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type StaffRole = (typeof STAFF_ROLES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type CustomizationType = (typeof CUSTOMIZATION_TYPES)[number]

export interface JwtPayload {
  id: string
  role: "OWNER" | "MANAGER" | "KITCHEN" | "COUNTER" | "CONSUMER"
  restaurantId?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
