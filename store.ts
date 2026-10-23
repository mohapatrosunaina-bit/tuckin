import { Order } from './domain.js';

export interface OrderStore {
  createOrder(order: Order): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderByRestaurantAndIdempotencyKey(restaurantId: string, key: string): Promise<Order | undefined>;
  listOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: Order['status']): Promise<Order | undefined>;
}

export class InMemoryOrderStore implements OrderStore {
  private orders: Map<string, Order> = new Map();
  private idempotencyIndex: Map<string, string> = new Map();

  async createOrder(order: Order): Promise<Order> {
    this.orders.set(order.id, { ...order });
    if (order.idempotencyKey) {
      this.idempotencyIndex.set(`${order.restaurantId}:${order.idempotencyKey}`, order.id);
    }
    return { ...order };
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const found = this.orders.get(id);
    return found ? { ...found } : undefined;
  }

  async getOrderByRestaurantAndIdempotencyKey(restaurantId: string, key: string): Promise<Order | undefined> {
    const orderId = this.idempotencyIndex.get(`${restaurantId}:${key}`);
    if (!orderId) return undefined;
    return this.getOrderById(orderId);
  }

  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .map((order) => ({ ...order }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated: Order = {
      ...order,
      status,
      updatedAt: new Date().toISOString()
    };
    this.orders.set(id, updated);
    return { ...updated };
  }
}
