export interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  parent_id?: string | null
  subcategories?: Category[]
  product_count?: number
}

export interface ProductImage {
  id: string
  url: string
  sort_order: number
}

export interface ProductSize {
  size: string
  stock: number
}

export interface Product {
  id: string
  name: string
  slug: string
  category_id: string
  category?: Category
  description: string
  price: number
  sale_price?: number | null
  images: ProductImage[]
  sizes: ProductSize[]
  stock: number
  is_active: boolean
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  customer_name: string
  rating: number
  comment: string
  created_at: string
}

export interface CartItem {
  product_id: string
  product_name: string
  product_image: string
  price: number
  sale_price?: number | null
  size: string
  quantity: number
  max_stock: number
  category_id?: string | null
  category_name?: string | null
}

export interface WishlistItem {
  product_id: string
  product_name: string
  product_image: string
  price: number
  sale_price?: number | null
}

export type PaymentMethod = 'cash_on_delivery'

export interface OrderFormData {
  full_name: string
  phone: string
  province: string
  district: string
  city?: string
  area: string
  landmark?: string
  payment_method: PaymentMethod
  courier_id?: string
  notes?: string
  promo_code?: string
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'failed'
  | 'held'

export interface OrderEvent {
  id: string
  order_id: string
  status: OrderStatus
  note?: string
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string
  province: string
  district: string
  city?: string
  area: string
  landmark?: string
  lat?: number
  lng?: number
  payment_method: PaymentMethod
  notes?: string
  promo_code?: string
  subtotal: number
  discount: number
  total: number
  status: OrderStatus
  courier_id?: string
  courier?: Courier
  items: OrderItem[]
  events: OrderEvent[]
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string
  size: string
  quantity: number
  unit_price: number
  line_price: number
}

export interface LiveFeedEntry {
  id: string
  customer_first_name: string
  product_name: string
  size: string
  created_at: string
}

export interface Courier {
  id: string
  name: string
  api_endpoint: string
  api_key: string
  hq_lat: number
  hq_lng: number
  coverage_radius_km: number
  covered_districts: string[] | null
  priority: number
  is_active: boolean
  created_at: string
}

export interface PromoCode {
  id: string
  code: string
  type: 'percent' | 'flat'
  value: number
  min_order_amount: number
  usage_limit: number
  usage_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface ShopSettings {
  id: string
  shop_name: string
  shop_tagline: string
  logo_url?: string
  contact_email: string
  contact_phone: string
  instagram_url?: string
  facebook_url?: string
  tiktok_url?: string
  live_feed_enabled: boolean
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
