export type UserRole = "admin" | "seller" | "delivery" | "user";

export type OrderStatus =
  | "pending"
  | "paymentConfirmed"
  | "approved"
  | "outForDelivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "evcPlus" | "edahab";

export interface Profile {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  store_id: string | null;
  phone: string | null;
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
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
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
  /** Isku xir dalabaadyada hal checkout (dukaamo badan) */
  checkout_group_id?: string | null;
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
