import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DeliveryStore } from '../src/domain.js';

describe('Delivery Service Health & Middleware', () => {
  const app = createApp();

  it('responds with 200 on /health/live', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'live', service: 'delivery-service' });
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('responds with 200 on /health/ready', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready', service: 'delivery-service' });
  });

  it('returns standard error structure for unknown routes', async () => {
    const res = await request(app).get('/unknown-path');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });
});

describe('Delivery Simulation & Tracking', () => {
  let store: DeliveryStore;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new DeliveryStore();
    app = createApp({ store });
  });

  it('initializes default tracking with estimated minutes on GET /api/delivery/:orderId', async () => {
    const res = await request(app).get('/api/delivery/order-101');
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe('order-101');
    expect(res.body.status).toBe('PLACED');
    expect(res.body.estimatedDeliveryMinutes).toBe(35);
    expect(res.body.simulated).toBe(true);
  });

  it('progresses delivery through milestone sequence on POST /api/delivery/:orderId/simulate-next', async () => {
    // 1. Initial status: PLACED
    const initial = await request(app).get('/api/delivery/order-step-test');
    expect(initial.body.status).toBe('PLACED');

    // 2. Step to ACCEPTED
    const step1 = await request(app).post('/api/delivery/order-step-test/simulate-next');
    expect(step1.status).toBe(200);
    expect(step1.body.status).toBe('ACCEPTED');
    expect(step1.body.estimatedDeliveryMinutes).toBe(30);

    // 3. Step to PREPARING
    const step2 = await request(app).post('/api/delivery/order-step-test/simulate-next');
    expect(step2.status).toBe(200);
    expect(step2.body.status).toBe('PREPARING');
    expect(step2.body.estimatedDeliveryMinutes).toBe(25);

    // 4. Step to PICKED_UP
    const step3 = await request(app).post('/api/delivery/order-step-test/simulate-next');
    expect(step3.body.status).toBe('PICKED_UP');
    expect(step3.body.estimatedDeliveryMinutes).toBe(15);

    // 5. Step to OUT_FOR_DELIVERY
    const step4 = await request(app).post('/api/delivery/order-step-test/simulate-next');
    expect(step4.body.status).toBe('OUT_FOR_DELIVERY');
    expect(step4.body.estimatedDeliveryMinutes).toBe(8);

    // 6. Step to DELIVERED
    const step5 = await request(app).post('/api/delivery/order-step-test/simulate-next');
    expect(step5.body.status).toBe('DELIVERED');
    expect(step5.body.estimatedDeliveryMinutes).toBe(0);

    // 7. Further step remains DELIVERED
    const step6 = await request(app).post('/api/delivery/order-step-test/simulate-next');
    expect(step6.body.status).toBe('DELIVERED');
  });

  it('allows explicit status update on POST /api/delivery/:orderId/status', async () => {
    const res = await request(app)
      .post('/api/delivery/order-sync-test/status')
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
    expect(res.body.estimatedDeliveryMinutes).toBe(0);
  });

  it('serves stable v1 metadata when canary flag is disabled', async () => {
    delete process.env.CANARY_RELEASE;
    delete process.env.FEATURE_AI_ETA_ENABLED;

    const res = await request(app).get('/api/delivery/stable-order');
    expect(res.status).toBe(200);
    expect(res.headers['x-track-version']).toBe('v1-stable');
    expect(res.body.etaModel).toBeUndefined();
  });

  it('serves enhanced v2 canary metadata and headers when canary feature flag is enabled', async () => {
    process.env.FEATURE_AI_ETA_ENABLED = 'true';

    const res = await request(app).get('/api/delivery/canary-order');
    expect(res.status).toBe(200);
    expect(res.headers['x-track-version']).toBe('v2-canary-eta');
    expect(res.body.etaModel).toBe('ai-traffic-aware-v2');
    expect(res.body.confidenceScore).toBe(0.94);

    delete process.env.FEATURE_AI_ETA_ENABLED;
  });
});
