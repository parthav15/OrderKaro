export interface CustomizationOption {
  id: string
  name: string
  priceAdjustment: string
  isDefault: boolean
}

export interface Customization {
  id: string
  name: string
  type: string
  isRequired: boolean
  minSelect?: number
  maxSelect?: number
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
  tags: string[]
  customizations: Customization[]
  model3dUrl?: string | null
  model3dUsdzUrl?: string | null
  model3dPosterUrl?: string | null
}

export interface Category {
  id: string
  name: string
  items: MenuItem[]
}

export interface RestaurantSummary {
  id?: string
  name: string
  slug: string
  logoUrl?: string | null
  bannerUrl?: string | null
  isActive?: boolean
  primaryColor?: string
  themeMode?: "LIGHT" | "DARK"
  arEnabled?: boolean
  deliveryEnabled?: boolean
  deliveryRadiusKm?: number
  deliveryFee?: string
  minOrderValue?: string
  hasLocation?: boolean
}

export interface Announcement {
  id: string
  message: string
  isActive: boolean
  expiresAt?: string | null
}

export interface ResolvedTable {
  id: string
  label: string
  section?: string | null
}
