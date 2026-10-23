import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Restaurant Service Health & Middleware', () => {
  const app = createApp();

  it('responds with 200 on /health/live', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'live', service: 'restaurant-service' });
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('responds with 200 on /health/ready', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready', service: 'restaurant-service' });
  });

  it('returns standard error structure for unknown routes', async () => {
    const res = await request(app).get('/unknown-path');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });

  it('lists all seeded restaurants on GET /api/restaurants', async () => {
    const res = await request(app).get('/api/restaurants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.restaurants)).toBe(true);
    expect(res.body.restaurants.length).toBeGreaterThan(0);
    expect(res.body.restaurants[0]).toHaveProperty('id');
    expect(res.body.restaurants[0]).toHaveProperty('name');
  });

  it('returns a restaurant by ID on GET /api/restaurants/:restaurantId', async () => {
    const res = await request(app).get('/api/restaurants/rest-spice-box');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('rest-spice-box');
    expect(res.body.name).toBe('The Spice Box Kitchen');
  });

  it('returns 404 for non-existent restaurant on GET /api/restaurants/:restaurantId', async () => {
    const res = await request(app).get('/api/restaurants/non-existent-id');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESTAURANT_NOT_FOUND');
  });

  it('returns menu items for a restaurant on GET /api/restaurants/:restaurantId/menu', async () => {
    const res = await request(app).get('/api/restaurants/rest-spice-box/menu');
    expect(res.status).toBe(200);
    expect(res.body.restaurantId).toBe('rest-spice-box');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].pricePaise).toBeTypeOf('number');
  });

  it('returns a specific menu item on GET /api/menu-items/:itemId', async () => {
    const res = await request(app).get('/api/menu-items/item-biryani-001');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('item-biryani-001');
    expect(res.body.pricePaise).toBe(24000);
  });

  it('returns 404 for non-existent menu item on GET /api/menu-items/:itemId', async () => {
    const res = await request(app).get('/api/menu-items/invalid-item-id');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('MENU_ITEM_NOT_FOUND');
  });
});
