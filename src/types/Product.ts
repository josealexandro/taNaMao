export interface Product {
  id?: string;
  name: string;
  price: number;
  image: string;
  restaurantId: string;
  category: string; // Ex: Pizzas, Bebidas, Lanches
  isActive: boolean; // Para desativar o produto sem excluir
}
