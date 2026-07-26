export interface CustomizationOption {
  id: string
  name: string
  priceAdjustment: string
  isDefault: boolean
  sortOrder: number
}

export interface Customization {
  id: string
  name: string
  type: "SINGLE_SELECT" | "MULTI_SELECT"
  isRequired: boolean
  minSelect: number
  maxSelect: number
  options: CustomizationOption[]
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isVeg: boolean
  isAvailable: boolean
  availableForDelivery: boolean
  tags: string[]
  model3dUrl: string | null
  model3dUsdzUrl?: string | null
  model3dPosterUrl: string | null
  customizations: Customization[]
}

export interface Category {
  id: string
  name: string
  items: MenuItem[]
}

export interface Restaurant {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  openingTime: string
  closingTime: string
  avgPrepTime: number
  primaryColor: string
  deliveryEnabled: boolean
  deliveryRadiusKm: number
  deliveryFee: string
  minOrderValue: string
  hasLocation: boolean
  arEnabled: boolean
  onlinePaymentEnabled: boolean
  acceptsCash: boolean
  acceptsOnline: boolean
  acceptsDineIn: boolean
  acceptsTakeaway: boolean
  acceptsDelivery: boolean
}

export interface MenuResponse {
  restaurant: Restaurant
  categories: Category[]
  tables: { id: string; label: string }[]
}

export interface PaymentSession {
  provider: "PAYPUR" | "STRIPE" | "CASHFREE"
  redirectUrl: string
  qrUrl: string | null
  upiIntent: string | null
  amount: number
  currency: string
  pollUrl: string
  pollBody: Record<string, unknown>
}

export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "CANCELLED"

export interface ConsumerOrder {
  id: string
  orderNumber: number
  status: OrderStatus
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  totalAmount: string
  paymentStatus: string
  placedAt: string
  trackingToken: string | null
  restaurantId: string
  restaurant: { name: string; slug: string }
  table: { label: string } | null
  items: { id: string; menuItemId: string; quantity: number; unitPrice: string; menuItem: { name: string } }[]
}

export interface OwnerRestaurant {
  id: string
  name: string
  slug: string
  openingTime?: string
  closingTime?: string
  avgPrepTime?: number
  primaryColor?: string
  themeMode?: "LIGHT" | "DARK"
  deliveryEnabled?: boolean
  latitude?: number | null
  longitude?: number | null
  deliveryRadiusKm?: number
  deliveryFee?: string
  minOrderValue?: string
  country?: string
  currency?: string
  smsEnabled?: boolean
  notifyOrderPlaced?: boolean
  notifyOrderAccepted?: boolean
  notifyOrderPreparing?: boolean
  notifyOrderReady?: boolean
  notifyOrderCompleted?: boolean
  notifyOrderCancelled?: boolean
  notifyOwnerNewOrder?: boolean
}

export interface ActiveOrder {
  id: string
  orderNumber: number
  status: OrderStatus
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  totalAmount: string
  paymentMethod: string
  paymentStatus: string
  deliveryLocation: string | null
  specialInstructions: string | null
  placedAt: string
  items: { id: string; quantity: number; menuItem: { name: string } }[]
  table: { label: string } | null
  consumer: { name: string; phone: string } | null
}

export interface AnalyticsSummary {
  totalOrders: number
  totalRevenue: string
  todayOrders: number
  todayRevenue: string
  activeOrders: number
  avgPrepTimeMinutes: number | null
}

export interface TrackedOrder {
  id: string
  orderNumber: number
  status: OrderStatus
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  totalAmount: string
  paymentStatus: string
  paymentMethod: string
  placedAt: string
  acceptedAt: string | null
  preparingAt: string | null
  readyAt: string | null
  pickedUpAt: string | null
  cancelledAt: string | null
  items: { id: string; quantity: number; menuItem: { name: string; imageUrl: string | null } }[]
  restaurant: { name: string; avgPrepTime: number }
}
