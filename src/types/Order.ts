export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed';
  createdAt: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp (opcional)
}
