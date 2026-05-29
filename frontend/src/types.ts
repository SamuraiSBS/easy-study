export type Service = {
  id: number;
  title: string;
  description: string;
  price_from: number;
  estimated_time: string;
};

export type OrderStatus = "new" | "in_progress" | "completed" | "cancelled";

export type Order = {
  id: number;
  service: Service;
  topic: string;
  subject: string | null;
  deadline: string;
  comment: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: number;
  rating: number;
  text: string;
  order_id: number | null;
  created_at: string;
  first_name: string | null;
  username: string | null;
};

export type OrderPayload = {
  service_id: number;
  topic: string;
  subject?: string;
  deadline: string;
  comment?: string;
};

export type ReviewPayload = {
  rating: number;
  text: string;
  order_id?: number;
};
