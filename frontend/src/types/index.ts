export type Role = 'super_admin' | 'admin' | 'user';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  role: Role;
  avatar: string | null;
  avatar_url: string | null;
  is_active: boolean;
  date_joined: string;
  updated_at: string;
}

export type OrderType = 'pickup' | 'delivery';
export type OrderStatus = 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

export interface Order {
  id: number;
  order_id: string;
  user: number | null;
  user_details: Partial<User> | null;
  customer_name: string;
  phone: string;
  address: string;
  order_type: OrderType;
  order_type_display: string;
  quantity: number;
  unit_price: string;
  delivery_charge: string;
  total_price: string;
  status: OrderStatus;
  status_display: string;
  payment_status: PaymentStatus;
  payment_status_display: string;
  notes: string;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

export interface OrderCreateData {
  customer_name: string;
  phone: string;
  address?: string;
  order_type: OrderType;
  quantity: number;
  unit_price?: number;
  delivery_charge?: number;
  notes?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface DashboardStats {
  today_earnings: number;
  total_earnings: number;
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  pickup_orders: number;
  delivery_orders: number;
  processing_orders: number;
  out_for_delivery_orders: number;
  total_customers: number;
  total_admins: number;
  monthly_data: MonthlyData[];
  recent_orders: Order[];
  recent_activities: Activity[];
}

export interface AdminDashboardStats {
  today_orders: number;
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  pickup_orders: number;
  delivery_orders: number;
  out_for_delivery: number;
  recent_orders: Order[];
}

export interface MonthlyData {
  month: string;
  orders: number;
  earnings: number;
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  description: string;
  created_at: string;
}

export interface PlantSettings {
  id: number;
  bottle_price: string;
  delivery_charge: string;
  plant_name: string;
  plant_address: string;
  plant_phone: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_name: string;
  user_email: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}
