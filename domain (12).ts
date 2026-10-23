export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalPaise: number;
  deliveryZone: string;
  estimatedDeliveryMinutes: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderInput {
  restaurantId: string;
  deliveryZone?: string;
  items: CreateOrderItemInput[];
}

export interface MenuItemLookup {
  id: string;
  restaurantId: string;
  name: string;
  pricePaise: number;
  available: boolean;
}

// Invariant: Allowed status transitions
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PICKED_UP'],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Calculates server-side line totals and order total strictly in integer paise.
 * Throws an error if quantities are non-positive or if an item is not found or unavailable.
 */
export function calculateOrderItems(
  requestedItems: CreateOrderItemInput[],
  menuItemResolver: (itemId: string) => MenuItemLookup | undefined
): { items: OrderItem[]; totalPaise: number } {
  if (!requestedItems || requestedItems.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let totalPaise = 0;
  const items: OrderItem[] = [];

  for (const itemInput of requestedItems) {
    if (!itemInput.menuItemId || typeof itemInput.menuItemId !== 'string') {
      throw new Error('Invalid menuItemId');
    }
    if (!itemInput.quantity || typeof itemInput.quantity !== 'number' || itemInput.quantity <= 0 || !Number.isInteger(itemInput.quantity)) {
      throw new Error(`Quantity for item '${itemInput.menuItemId}' must be a positive integer`);
    }

    const menuItem = menuItemResolver(itemInput.menuItemId);
    if (!menuItem) {
      throw new Error(`Menu item '${itemInput.menuItemId}' not found`);
    }

    if (!menuItem.available) {
      throw new Error(`Menu item '${menuItem.name}' is currently unavailable`);
    }

    // Money is strictly integer paise
    const unitPricePaise = Math.round(menuItem.pricePaise);
    const lineTotalPaise = unitPricePaise * itemInput.quantity;
    totalPaise += lineTotalPaise;

    items.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: itemInput.quantity,
      unitPricePaise,
      lineTotalPaise
    });
  }

  return { items, totalPaise };
}
