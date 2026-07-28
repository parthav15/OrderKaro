export interface CountryInfo {
  code: string
  name: string
  flag: string
  currency: string
  dialCode: string
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", dialCode: "+91" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", dialCode: "+61" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", currency: "NZD", dialCode: "+64" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "AED", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", dialCode: "+966" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", currency: "QAR", dialCode: "+974" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", currency: "BHD", dialCode: "+973" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", currency: "KWD", dialCode: "+965" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", dialCode: "+65" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", currency: "MYR", dialCode: "+60" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", currency: "IDR", dialCode: "+62" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB", dialCode: "+66" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP", dialCode: "+63" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", currency: "VND", dialCode: "+84" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", currency: "HKD", dialCode: "+852" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", dialCode: "+81" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", dialCode: "+33" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR", dialCode: "+34" },
  { code: "IT", name: "Italy", flag: "🇮🇹", currency: "EUR", dialCode: "+39" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR", dialCode: "+31" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", currency: "EUR", dialCode: "+353" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", currency: "EUR", dialCode: "+32" },
  { code: "AT", name: "Austria", flag: "🇦🇹", currency: "EUR", dialCode: "+43" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", currency: "EUR", dialCode: "+351" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", currency: "CHF", dialCode: "+41" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", currency: "SEK", dialCode: "+46" },
  { code: "NO", name: "Norway", flag: "🇳🇴", currency: "NOK", dialCode: "+47" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", currency: "DKK", dialCode: "+45" },
  { code: "PL", name: "Poland", flag: "🇵🇱", currency: "PLN", dialCode: "+48" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", dialCode: "+27" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", dialCode: "+234" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", dialCode: "+254" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", dialCode: "+52" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", dialCode: "+55" },
]

export const DEFAULT_COUNTRY_CODE = "IN"

export const SUPPORTED_COUNTRY_CODES = SUPPORTED_COUNTRIES.map((c) => c.code)

export function countryByCode(code: string | null | undefined): CountryInfo | undefined {
  if (!code) return undefined
  const upper = code.toUpperCase()
  return SUPPORTED_COUNTRIES.find((c) => c.code === upper)
}

export function currencyForCountryCode(code: string | null | undefined): string {
  return countryByCode(code)?.currency ?? "USD"
}
