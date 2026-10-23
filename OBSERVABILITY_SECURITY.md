# Observability and DevSecOps

## Metrics

Use Prometheus-compatible metrics with bounded label cardinality. Never use order IDs, customer names, or arbitrary request paths as metric labels.

Recommended metrics:
- `http_requests_total{service,method,route,status_class}`
- `http_request_duration_seconds{service,route}` histogram
- `orders_created_total{result}`
- `order_failures_total{reason}` with a small controlled reason set
- `delivery_duration_seconds` histogram or summary
- process/runtime metrics

Keep names and labels consistent across services.

## Grafana dashboard

Minimum panels:
1. Order throughput (orders created per minute).
2. HTTP request rate by service.
3. Order failure rate.
4. p50/p95 request latency.
5. Average/p95 delivery duration.
6. Order Service pod count and CPU/memory usage, if cluster metrics are available.
7. Deployment/canary version split, if the chosen routing layer exposes it.

Dashboard should have a useful time range and clear units. Include a screenshot in final evidence.

## Alerting

Create an alert for elevated order failure rate during a sustained window. Avoid alerting on one isolated request. Example starting policy:
- Alert when 5xx ratio exceeds 5% and at least a minimum request volume is present for 5 minutes.
- Add a separate alert for service unavailable/readiness failure if feasible.

Tune PromQL to the actual metric names. Test the alert by safely injecting a controlled failure in a demo environment, then confirm recovery.

## Logging and retention

- Emit structured JSON logs to stdout/stderr.
- Include timestamp, level, service, requestId, and event name.
- Do not log credentials, authorization headers, full addresses, or payment data.
- Ansible should configure a scheduled retention job for old **delivery tracking logs**. Prefer a dedicated log directory and a dry-run option. Ensure it cannot delete arbitrary paths; test retention cutoff behavior.

## Security gates

- Trivy image scan before push.
- SAST scan focused on Order Service pricing logic and the full service where supported.
- Dependency vulnerability scan.
- Secret scanning in CI.
- PR review requirement for pricing/order-total changes.
- Least-privilege CI permissions.
- Non-root runtime and minimal images where feasible.
- Input validation, bounded request sizes, safe error messages, and rate limiting if time permits.

## Secret handling

- Local secrets belong in ignored `.env` files and should be represented by `.env.example` placeholders.
- GitHub Actions secrets are for CI credentials, not a replacement for secure runtime secret management.
- Vault may be used if available; do not add it only for appearance.
- Mock payment gateway keys must be obviously fake.
- If a real secret is accidentally committed, revoke/rotate it and clean up according to GitHub's guidance; deleting the line in a later commit does not invalidate the secret.

## Lunch-hour test report

Record:
- date, commit SHA, environment, cluster/node limits;
- workload shape and request mix;
- baseline and peak request rate;
- p95 latency, error rate, orders accepted;
- HPA desired/current replicas and timing;
- pod restarts or saturation;
- Grafana/Prometheus evidence;
- what failed, what improved, and known limitations.

Never invent performance results; measurements must come from a real run.
