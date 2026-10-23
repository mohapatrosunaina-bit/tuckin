import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { InMemoryOrderStore } from '../src/store.js';
import { calculateOrderItems, isValidTransition, OrderStatus } from '../src/domain.js';
import { DEFAULT_MENU_ITEMS, createDefaultResolver } from '../src/menuResolver.js';

describe('Order Domain Logic (Unit)', () => {
  const resolver = createDefaultResolver();

  it('calculates line totals and totalPaise correctly using integer arithmetic', () => {
    const requested = [
      { menuItemId: 'item-biryani-001', quantity: 2 }, // 24000 * 2 = 48000
      { menuItemId: 'item-bread-001', quantity: 3 }     // 6000 * 3 = 18000
    ];

    const result = calculateOrderItems(requested, (id) => resolver(id) as any);
    expect(result.totalPaise).toBe(66000);
    expect(result.items.length).toBe(2);
    expect(result.items[0].lineTotalPaise).toBe(48000);
    expect(result.items[1].lineTotalPaise).toBe(18000);
  });

  it('throws an error when order items array is empty', () => {
    expect(() => calculateOrderItems([], () => undefined)).toThrow('Order must contain at least one item');
  });

  it('throws an error for non-positive or non-integer quantities', () => {
    expect(() =>
      calculateOrderItems([{ menuItemId: 'item-biryani-001', quantity: 0 }], (id) => resolver(id) as any)
    ).toThrow("Quantity for item 'item-biryani-001' must be a positive integer");

    expect(() =>
      calculateOrderItems([{ menuItemId: 'item-biryani-001', quantity: 1.5 }], (id) => resolver(id) as any)
    ).toThrow("Quantity for item 'item-biryani-001' must be a positive integer");
  });

  it('throws an error when an item is not found', () => {
    expect(() =>
      calculateOrderItems([{ menuItemId: 'unknown-item', quantity: 1 }], (id) => resolver(id) as any)
    ).toThrow("Menu item 'unknown-item' not found");
  });

  it('throws an error when an item is unavailable', () => {
    expect(() =>
      calculateOrderItems([{ menuItemId: 'item-unavailable-demo', quantity: 1 }], (id) => resolver(id) as any)
    ).toThrow("Menu item 'Seasonal Mango Kulfi' is currently unavailable");
  });

  it('enforces status transition state machine accurately', () => {
    // Valid transitions
    expect(isValidTransition('PLACED', 'ACCEPTED')).toBe(true);
    expect(isValidTransition('PLACED', 'CANCELLED')).toBe(true);
    expect(isValidTransition('ACCEPTED', 'PREPARING')).toBe(true);
    expect(isValidTransition('ACCEPTED', 'CANCELLED')).toBe(true);
    expect(isValidTransition('PREPARING', 'PICKED_UP')).toBe(true);
    expect(isValidTransition('PICKED_UP', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(isValidTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);

    // Invalid transitions
    expect(isValidTransition('PLACED', 'DELIVERED')).toBe(false);
    expect(isValidTransition('PREPARING', 'CANCELLED')).toBe(false);
    expect(isValidTransition('DELIVERED', 'CANCELLED')).toBe(false);
    expect(isValidTransition('CANCELLED', 'PLACED')).toBe(false);
  });
});

describe('Order Service Endpoints & Integration', () => {
  let store: InMemoryOrderStore;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new InMemoryOrderStore();
    app = createApp({ store });
  });

  it('responds with 200 on /health/live and /health/ready', async () => {
    const live = await request(app).get('/health/live');
    expect(live.status).toBe(200);
    expect(live.body.status).toBe('live');

    const ready = await request(app).get('/health/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.status).toBe('ready');
  });

  it('exposes Prometheus metrics on /metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('order_service_orders_placed_total');
  });

  it('returns 404 for unknown paths with structured error format', async () => {
    const res = await request(app).get('/api/not-found');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });

  it('creates an order successfully with computed server-side prices (Happy Path)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        restaurantId: 'rest-spice-box',
        deliveryZone: 'zone-central-demo',
        items: [
          { menuItemId: 'item-biryani-001', quantity: 2 },
          { menuItemId: 'item-bread-001', quantity: 1 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('PLACED');
    expect(res.body.totalPaise).toBe(24000 * 2 + 6000); // 54000 paise
    expect(res.body.items.length).toBe(2);
    expect(res.body.items[0].name).toBe('Royal Veg Dum Biryani');
  });

  it('rejects order with 400 when body input is invalid', async () => {
    const resNoItems = await request(app).post('/api/orders').send({ restaurantId: 'rest-spice-box', items: [] });
    expect(resNoItems.status).toBe(400);

    const resNoRest = await request(app).post('/api/orders').send({ items: [{ menuItemId: 'item-biryani-001', quantity: 1 }] });
    expect(resNoRest.status).toBe(400);
  });

  it('rejects unavailable items with 400 ITEM_UNAVAILABLE', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        restaurantId: 'rest-spice-box',
        items: [{ menuItemId: 'item-unavailable-demo', quantity: 1 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ITEM_UNAVAILABLE');
  });

  it('rejects unknown menu items with 404 MENU_ITEM_NOT_FOUND', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        restaurantId: 'rest-spice-box',
        items: [{ menuItemId: 'non-existent-item', quantity: 1 }]
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('MENU_ITEM_NOT_FOUND');
  });

  it('supports idempotent order creation with Idempotency-Key header', async () => {
    const key = 'test-idempotency-key-123';
    const payload = {
      restaurantId: 'rest-spice-box',
      items: [{ menuItemId: 'item-biryani-001', quantity: 1 }]
    };

    const first = await request(app).post('/api/orders').set('idempotency-key', key).send(payload);
    expect(first.status).toBe(201);

    // Second call with same idempotency key must return the existing order
    const second = await request(app).post('/api/orders').set('idempotency-key', key).send(payload);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.totalPaise).toBe(first.body.totalPaise);
  });

  it('retrieves an existing order on GET /api/orders/:orderId', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        restaurantId: 'rest-spice-box',
        items: [{ menuItemId: 'item-bread-001', quantity: 2 }]
      });

    const orderId = createRes.body.id;
    const getRes = await request(app).get(`/api/orders/${orderId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(orderId);
    expect(getRes.body.totalPaise).toBe(12000);
  });

  it('returns 404 when querying a non-existent order ID', async () => {
    const res = await request(app).get('/api/orders/unknown-order-id');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('lists placed orders on GET /api/orders', async () => {
    await request(app)
      .post('/api/orders')
      .send({
        restaurantId: 'rest-spice-box',
        items: [{ menuItemId: 'item-bread-001', quantity: 1 }]
      });

    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  it('allows valid order status transitions on PATCH /api/orders/:orderId/status', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        restaurantId: 'rest-spice-box',
        items: [{ menuItemId: 'item-biryani-001', quantity: 1 }]
      });

    const orderId = createRes.body.id;

    const patchRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'ACCEPTED' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('ACCEPTED');
  });

  it('rejects invalid state transitions with 409 Conflict', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        restaurantId: 'rest-spice-box',
        items: [{ menuItemId: 'item-biryani-001', quantity: 1 }]
      });

    const orderId = createRes.body.id;

    // Skipping directly to DELIVERED is not allowed
    const patchRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'DELIVERED' });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('returns 404 on PATCH status for non-existent order', async () => {
    const res = await request(app)
      .patch('/api/orders/non-existent-order/status')
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('returns 400 on PATCH status when status field is missing', async () => {
    const res = await request(app)
      .patch('/api/orders/some-id/status')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS');
  });
});
