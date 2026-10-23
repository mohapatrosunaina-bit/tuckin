import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../services/order-service/src/app.js';
import { runPeakLoadTest } from './load-test.js';
import http from 'http';

describe('Peak Load Simulation & SLA Verification', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('handles simulated lunch-hour burst under strict latency SLAs', async () => {
    const result = await runPeakLoadTest(baseUrl, 50, 5);

    expect(result.totalRequests).toBe(50);
    expect(result.successfulOrders).toBe(50);
    expect(result.failedRequests).toBe(0);
    expect(result.p95LatencyMs).toBeLessThan(200); // Strict SLA: p95 < 200ms
  });
});
