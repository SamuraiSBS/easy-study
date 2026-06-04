export type User = {
  id: number;
  telegram_id: string;
  first_name: string | null;
  username: string | null;
  photo_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: number;
  title: string;
  description: string;
  price_from: number;
  price_to: number | null;
  category: string;
  is_active: boolean;
  order_num: number;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = 'new' | 'contacted' | 'in_progress' | 'done' | 'cancelled';

export type Order = {
  id: number;
  user_id: number;
  service_id: number | null;
  title_snapshot: string;
  description_snapshot: string;
  price_from_snapshot: number;
  price_to_snapshot: number | null;
  category_snapshot: string;
  customer_comment: string;
  status: OrderStatus;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type AdminOrder = Order & {
  user: User;
};

export type Review = {
  id: number;
  user_id: number;
  order_id: number | null;
  rating: number;
  text: string;
  is_published: boolean;
  created_at: string;
};

export type AdminReview = Review & {
  user: User;
};

export type ServicePayload = Omit<Service, 'id' | 'created_at' | 'updated_at'>;

