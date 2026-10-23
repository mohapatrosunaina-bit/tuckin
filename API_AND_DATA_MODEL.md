# API Contracts and Data Model

API paths below are proposed contracts. Keep them consistent across frontend, tests, OpenAPI docs, and deployment routing.

## Shared conventions

- JSON request/response bodies.
- UTC ISO-8601 timestamps.
- Money represented as integer paise (`amountPaise`).
- Stable IDs (UUIDs or similarly collision-resistant IDs).
- Return `400` for malformed input, `404` for missing resources, `409` for conflicts/invalid state transitions, `422` for validly shaped but unacceptable business input where useful, and `500` only for unexpected failures.
- Include a request/correlation ID in logs and preferably response headers.
- Use consistent error shape: `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`.

## Restaurant Service

- `GET /health/live`
- `GET /health/ready`
- `GET /api/restaurants`
- `GET /api/restaurants/:restaurantId`
- `GET /api/restaurants/:restaurantId/menu`
- `GET /api/menu-items/:itemId`

Example menu item:

```json
{
  "id": "item-biryani-001",
  "restaurantId": "restaurant-demo-001",
  "name": "Veg Biryani",
  "description": "Demo menu item",
  "pricePaise": 18000,
  "available": true
}
```

## Order Service

- `GET /health/live`
- `GET /health/ready`
- `GET /metrics`
- `POST /api/orders`
- `GET /api/orders/:orderId`
- `GET /api/orders`
- `PATCH /api/orders/:orderId/status`

Example create request:

```json
{
  "restaurantId": "restaurant-demo-001",
  "items": [
    { "menuItemId": "item-biryani-001", "quantity": 2 }
  ],
  "deliveryZone": "zone-central-demo"
}
```

The request intentionally does not accept a trusted price or total. The Order Service fetches authoritative menu prices and computes the total server-side. Accept an `Idempotency-Key` header for create requests.

Example response:

```json
{
  "id": "order-demo-uuid",
  "status": "PLACED",
  "items": [
    {
      "menuItemId": "item-biryani-001",
      "name": "Veg Biryani",
      "quantity": 2,
      "unitPricePaise": 18000,
      "lineTotalPaise": 36000
    }
  ],
  "totalPaise": 36000,
  "estimatedDeliveryMinutes": 35,
  "createdAt": "2026-10-14T06:00:00.000Z"
}
```

## Delivery Service

- `GET /health/live`
- `GET /health/ready`
- `GET /api/delivery/:orderId`
- `POST /api/delivery/:orderId/simulate-next` (development/demo only; protect or disable outside demo environments)

Example:

```json
{
  "orderId": "order-demo-uuid",
  "status": "PREPARING",
  "estimatedDeliveryMinutes": 35,
  "simulated": true,
  "updatedAt": "2026-10-14T06:01:00.000Z"
}
```

## Order status model

`PLACED → ACCEPTED → PREPARING → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED`

Allowed alternate transitions:
- `PLACED → CANCELLED`
- `ACCEPTED → CANCELLED` only if the demo rules permit it.

Reject transitions not listed above with `409 Conflict`. Keep delivery milestones consistent with the Order Service's authoritative status or document the event synchronization mechanism.

## Core data entities

- `Restaurant(id, name, description, deliveryZone, isOpen)`
- `MenuItem(id, restaurantId, name, description, pricePaise, available)`
- `Order(id, restaurantId, status, totalPaise, deliveryZone, idempotencyKey, createdAt, updatedAt)`
- `OrderItem(id, orderId, menuItemId, itemNameSnapshot, unitPricePaise, quantity, lineTotalPaise)`
- `DeliveryTracking(id, orderId, status, estimatedDeliveryMinutes, simulated, updatedAt)`

Snapshot item name and unit price into the order at placement time so later menu edits do not rewrite historical orders.
