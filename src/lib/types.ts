export type UserRole = "admin" | "seller" | "restaurant" | "delivery" | "user" | "real_estate" | "second_hand";
export type FulfillmentType = "delivery" | "pickup";

export type OrderStatus =
  | "pending"
  | "paymentConfirmed"
  | "approved"
  | "outForDelivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "evcPlus" | "edahab" | "cash";

export interface Profile {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  store_id?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  contact: string;
  rating: number;
  followers: number;
  is_approved: boolean;
  owner_id: string;
  has_delivery: boolean;
  evc_number: string | null;
  edahab_number: string | null;
  is_restaurant?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  discount_expires_at?: string | null; // ISO string expiration date/time
  image: string;
  images: string[];        // up to 4 image URLs (JSONB)
  video_url: string | null; // YouTube / MP4 / Supabase URL
  category_id: string;
  store_id: string;
  store_name: string;
  rating: number;
  stock: number;
  is_approved: boolean;
}

export interface PropertyListing {
  id: string;
  owner_id?: string | null;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price: number;
  currency: string;
  location: string;
  images: string[];        // up to 4 image URLs (JSONB)
  video_url: string | null;
  is_approved: boolean;
  is_available: boolean;
  created_at: string;
}

export interface SecondHandItem {
  id: string;
  owner_id?: string | null;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  currency: string;
  location: string;
  images: string[];        // up to 4 image URLs (JSONB)
  video_url: string | null;
  status: string;
  seller_name: string;
  created_at: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  originalPrice?: number | null;
  quantity: number;
  storeId: string;
  storeName: string;
  image: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  date: string;
  status: OrderStatus;
  store_id: string;
  payment_method: PaymentMethod;
  is_paid: boolean;
  delivery_person_id: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  checkout_group_id?: string | null;
  is_pos_order?: boolean;
  fulfillment_type?: FulfillmentType;
  delivery_fee?: number;
  cancelled_by_driver_name?: string | null;
  driver_cancelled_at?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface PromoBanner {
  id: string;
  image_url: string;
  title: string;
  tag: string;
  btn_text: string;
  color_hex: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export interface StoreRevenue {
  store: Store;
  revenue: number;
  orderCount: number;
}
