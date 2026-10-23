export type DeliveryStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryTracking {
  orderId: string;
  status: DeliveryStatus;
  estimatedDeliveryMinutes: number;
  simulated: boolean;
  updatedAt: string;
}

export const DELIVERY_STEP_SEQUENCE: DeliveryStatus[] = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

export const STATUS_ESTIMATES: Record<DeliveryStatus, number> = {
  PLACED: 35,
  ACCEPTED: 30,
  PREPARING: 25,
  PICKED_UP: 15,
  OUT_FOR_DELIVERY: 8,
  DELIVERED: 0,
  CANCELLED: 0
};

export class DeliveryStore {
  private trackingRecords: Map<string, DeliveryTracking> = new Map();

  get(orderId: string): DeliveryTracking {
    let record = this.trackingRecords.get(orderId);
    if (!record) {
      record = {
        orderId,
        status: 'PLACED',
        estimatedDeliveryMinutes: STATUS_ESTIMATES.PLACED,
        simulated: true,
        updatedAt: new Date().toISOString()
      };
      this.trackingRecords.set(orderId, record);
    }
    return { ...record };
  }

  simulateNext(orderId: string): DeliveryTracking {
    const current = this.get(orderId);
    const currentIndex = DELIVERY_STEP_SEQUENCE.indexOf(current.status);

    let nextStatus: DeliveryStatus;
    if (currentIndex === -1 || currentIndex >= DELIVERY_STEP_SEQUENCE.length - 1) {
      nextStatus = current.status; // Remain at DELIVERED or terminal state
    } else {
      nextStatus = DELIVERY_STEP_SEQUENCE[currentIndex + 1];
    }

    const updated: DeliveryTracking = {
      orderId,
      status: nextStatus,
      estimatedDeliveryMinutes: STATUS_ESTIMATES[nextStatus],
      simulated: true,
      updatedAt: new Date().toISOString()
    };

    this.trackingRecords.set(orderId, updated);
    return { ...updated };
  }

  setStatus(orderId: string, status: DeliveryStatus): DeliveryTracking {
    const updated: DeliveryTracking = {
      orderId,
      status,
      estimatedDeliveryMinutes: STATUS_ESTIMATES[status] ?? 0,
      simulated: true,
      updatedAt: new Date().toISOString()
    };
    this.trackingRecords.set(orderId, updated);
    return { ...updated };
  }
}
