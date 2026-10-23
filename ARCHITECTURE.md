# Architecture

## Design principle

Use a **small distributed system** because separate services are explicitly required by the assignment. Keep each service narrow; avoid adding infrastructure that does not demonstrate a stated requirement.

## Logical topology

```text
Customer Browser ─────┐
                      ├── Ingress / local frontend proxy
Restaurant Operator ──┘             │
                         ┌───────────┼────────────┐
                         ▼           ▼            ▼
                    Frontend   Restaurant API  Order API
                                      │            │
                                      ▼            ├──────► PostgreSQL
                                 Menu data         │
                                                   ▼
                                            Delivery API
                                                   │
                                                   ▼
                                           Simulated status
```

The initial implementation can keep one PostgreSQL instance with service-owned schemas/tables for simplicity. Services must access data through their API contracts where feasible; do not let every service mutate every table. If the chosen persistence approach needs to be simplified for the assignment, record the trade-off.

## Deployable units

- `frontend`: React application, customer and restaurant views.
- `restaurant-service`: menu, restaurant availability, and seed data.
- `order-service`: order validation, server-side pricing, order creation, order transitions.
- `delivery-service`: simulated delivery status and ETA.
- `postgres`: local development dependency, not an application service.
- `prometheus`, `grafana`: observability dependencies.
- Optional ingress controller and metrics-server in Kubernetes environment.

## Service boundaries

### Restaurant Service
Owns restaurant/menu reads and availability. Provides seeded demo data and stable item IDs.

### Order Service
Owns order creation, order totals, status transitions, idempotency, and order metrics. This is the service with the explicit >=80% coverage gate.

### Delivery Tracking Service
Owns simulated delivery milestones and ETA. It must not claim to provide real GPS tracking.

### Frontend
Displays data and sends requests. It is not trusted for prices or authorization decisions.

## Reliability behavior

- Each service has `/health/live` and `/health/ready`.
- Readiness should fail when a required dependency is unavailable; liveness should indicate whether the process can continue.
- Set timeouts for service-to-service HTTP calls.
- Return structured errors without leaking stack traces to clients.
- Use graceful shutdown where practical.
- Use correlation IDs in requests/logs.
- Retry only safe/idempotent operations; do not blindly retry order creation without idempotency protection.

## Local vs Kubernetes routing

- Local: frontend uses configured API base URLs or a development proxy.
- Kubernetes: Ingress routes `/` to frontend, `/api/restaurants` to Restaurant Service, `/api/orders` to Order Service, and `/api/delivery` to Delivery Service. If path rewriting is used, document it and test it.
- Restaurant operator routes can be a distinct frontend route, e.g. `/restaurant`.

## Canary constraint

The assignment requires 20% canary exposure for a new estimated-delivery-time feature. A plain Kubernetes Deployment does not by itself guarantee weighted traffic splitting. Select and document a concrete mechanism:
- preferred if supported by the lab: ingress controller with weighted routing or a progressive-delivery controller such as Argo Rollouts;
- fallback for a constrained local cluster: a small gateway/proxy that performs deterministic weighted routing, with tests proving 20% routing over a sufficiently large sample.

Do not represent two Deployments with a 80/20 replica count as exact 80/20 traffic splitting. Include metrics, rollback steps, and the limitations of the selected approach.
