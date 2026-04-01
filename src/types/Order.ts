export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  total: number;
  address: string;
  clientName: string;
  clientPhone: string;
  status: 'pending' | 'completed';
  createdAt: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp (opcional)
  restaurantId: string; // ID do restaurante que recebeu o pedido
}
