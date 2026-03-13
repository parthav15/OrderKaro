import type {
  ORDER_STATUSES,
  STAFF_ROLES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  WALLET_TRANSACTION_TYPES,
  WALLET_TRANSACTION_SOURCES,
  WALLET_REQUEST_STATUSES,
  CUSTOMIZATION_TYPES,
} from "./constants"

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type StaffRole = (typeof STAFF_ROLES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number]
export type WalletTransactionSource = (typeof WALLET_TRANSACTION_SOURCES)[number]
export type WalletRequestStatus = (typeof WALLET_REQUEST_STATUSES)[number]
export type CustomizationType = (typeof CUSTOMIZATION_TYPES)[number]

export interface JwtPayload {
  id: string
  role: "OWNER" | "MANAGER" | "KITCHEN" | "COUNTER" | "CONSUMER"
  canteenId?: string
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
