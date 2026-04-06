import type { FieldValue, Timestamp } from 'firebase/firestore';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'pendente'
  | 'aceito'
  | 'preparando'
  | 'saiu_entrega'
  | 'concluido'
  | 'cancelado'
  | 'pending'
  | 'completed';

export interface Order {
  id?: string;
  items: OrderItem[];
  total: number;
  address: string;
  clientName: string;
  clientPhone: string;
  clientUid?: string | null;
  status: OrderStatus;
  createdAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
  restaurantId: string; // ID do restaurante que recebeu o pedido
}
