// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: number;
  product_id?: number;
  image_url: string;
  order?: number;
  is_primary?: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  discount_price?: number | null;
  stock: number;
  status: "active" | "inactive";
  image_url?: string | null;
  images?: ProductImage[];
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  in_stock: boolean;
  stock: number;
  image_url?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
  count: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product?: { id: number; name: string; sku: string };
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  provider: string;
  transaction_id: string | null;
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  paid_at: string | null;
}

export interface Delivery {
  id: number;
  consignment_id: string | null;
  carrier: string;
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "failed" | "returned";
  tracking_url: string | null;
  dispatched_at: string | null;
  failed_reason: string | null;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  subtotal: number;
  total: number;
  status: string;
  notes: string | null;
  items?: OrderItem[];
  payment?: Payment | null;
  delivery?: Delivery | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    paid: number;
    cancelled: number;
    delivered: number;
    by_status: Record<string, number>;
  };
  revenue: {
    total: number;
    this_week: number;
    last_week: number;
    trend: Array<{ date: string; revenue: number; orders: number }>;
  };
  inventory: {
    low_stock: Array<{ id: number; name: string; sku: string; stock: number }>;
    out_of_stock_count: number;
    total_products: number;
  };
  top_products: Array<{
    id: number;
    name: string;
    sku: string;
    total_sold: number;
    total_revenue: number;
  }>;
  payments: Record<string, number>;
  deliveries: Record<string, number>;
  recent_orders: Array<{
    id: number;
    customer_name: string;
    total: number;
    status: string;
    payment_status: string;
    created_at: string;
  }>;
}
