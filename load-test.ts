/**
 * Automated Repeatable Peak-Load Test Runner
 * Simulates a peak lunch-hour order burst against Order Service and tracks latency, status codes, and throughput.
 */

interface LoadResult {
  totalRequests: number;
  successfulOrders: number;
  failedRequests: number;
  latenciesMs: number[];
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

export async function runPeakLoadTest(
  baseUrl: string,
  totalOrders: number = 200,
  concurrency: number = 10
): Promise<LoadResult> {
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const itemsPool = [
    { menuItemId: 'item-biryani-001', quantity: 2 },
    { menuItemId: 'item-bread-001', quantity: 1 },
    { menuItemId: 'item-dosa-001', quantity: 1 }
  ];

  let inFlight = 0;
  let sent = 0;

  const runBatch = async (): Promise<void> => {
    const promises: Promise<void>[] = [];

    while (sent < totalOrders) {
      if (inFlight >= concurrency) {
        await Promise.race(promises);
      }

      sent++;
      inFlight++;

      const p = (async () => {
        const start = Date.now();
        try {
          const res = await fetch(`${baseUrl}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: 'rest-spice-box',
              deliveryZone: 'zone-central-demo',
              items: [itemsPool[Math.floor(Math.random() * itemsPool.length)]]
            })
          });

          const duration = Date.now() - start;
          latencies.push(duration);

          if (res.status === 201) {
            successful++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        } finally {
          inFlight--;
        }
      })();

      promises.push(p);
    }

    await Promise.all(promises);
  };

  await runBatch();

  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);
  const avgLatencyMs = latencies.length ? Math.round(sum / latencies.length) : 0;
  const p50LatencyMs = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99LatencyMs = latencies[Math.floor(latencies.length * 0.99)] || 0;

  return {
    totalRequests: totalOrders,
    successfulOrders: successful,
    failedRequests: failed,
    latenciesMs: latencies,
    avgLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    p99LatencyMs
  };
}

if (process.argv[1]?.endsWith('load-test.ts')) {
  const url = process.env.TARGET_URL || 'http://localhost:3002';
  console.log(`Starting repeatable load scenario against ${url}...`);
  runPeakLoadTest(url, 100, 10)
    .then((res) => {
      console.log('Peak Load Test Completed Successfully:');
      console.table({
        'Total Requests': res.totalRequests,
        'Successful Orders': res.successfulOrders,
        'Failed Requests': res.failedRequests,
        'Average Latency (ms)': res.avgLatencyMs,
        'p50 Latency (ms)': res.p50LatencyMs,
        'p95 Latency (ms)': res.p95LatencyMs,
        'p99 Latency (ms)': res.p99LatencyMs
      });
    })
    .catch((err) => {
      console.error('Load test run failed:', err);
      process.exit(1);
    });
}
