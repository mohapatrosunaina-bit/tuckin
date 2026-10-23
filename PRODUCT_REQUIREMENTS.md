# Product Requirements

## Product statement

A lightweight restaurant ordering and delivery simulation that makes the order journey observable and provides realistic, demonstrable operational behavior for a DevOps assignment.

## Users

- **Customer:** browses restaurants/menu, submits an order, and checks status.
- **Restaurant operator:** sees incoming orders and advances them through preparation/acceptance states.
- **Delivery simulator:** advances delivery state without requiring a real courier app.
- **Student/operator:** deploys, observes, scales, scans, and rolls back the platform.

## MVP scope

### Customer journey
1. Browse seeded restaurants and their menus.
2. Add menu items to an order.
3. Submit order with a basic delivery zone/address label.
4. See order ID, server-calculated total, estimated delivery time, and current status.
5. Refresh or poll to see simulated delivery status progression.

### Restaurant view
1. List orders in a manageable state.
2. Accept or reject an order.
3. Advance an accepted order to preparing and ready/picked-up states where appropriate.
4. See status timestamps.

### Delivery simulation
- A deterministic simulator updates delivery status at configured intervals or via a development-only action.
- The UI must label this as simulated tracking.
- No GPS, external maps, real courier dispatch, or real payment processing in MVP.

### Operational features
- Health/readiness endpoints and metrics.
- Structured logs with request/correlation ID.
- Automated unit, integration, and end-to-end tests.
- Docker Compose local environment.
- CI security and quality gates.
- Kubernetes + Helm deployment.
- HPA, canary demonstration, dashboards, alert, load test report.
- Terraform and Ansible artifacts aligned with the course environment.

## Out of scope for MVP

- Real payment processing.
- Real-time GPS or maps.
- Customer accounts/social login unless required later.
- Multi-vendor settlement, coupons, loyalty, reviews, chat, AI recommendations.
- Production-grade high availability across regions.
- A real third-party courier integration.

## Business rules

- Menu items have stable IDs, name, availability, and price in integer paise.
- Client-supplied price is never trusted.
- Order total is computed server-side from current menu prices and quantities.
- Quantity must be a positive integer with a configured maximum.
- Unavailable items cannot be ordered.
- An order status can only transition through documented valid transitions.
- An idempotency key should prevent accidental duplicate orders when a request is retried.
- Payment is represented as a mock state, not a real payment transaction.
- Delivery estimate is a simulation and must be described as such in UI and docs.

## Acceptance criteria

- A clean checkout creates one order and returns an order ID.
- Invalid quantity, unknown item, unavailable item, and invalid status transitions return clear 4xx responses.
- Total amount is calculated from server-side menu data and tested for rounding/overflow boundaries.
- Customer can retrieve order status and simulated delivery estimate.
- Restaurant operator can list and advance eligible orders.
- End-to-end automated test covers browse → place order → track status.
- Order Service test coverage is >= 80%, measured by the CI coverage tool.
- No credentials are present in tracked files.
- The local environment can be started and stopped using documented commands.
