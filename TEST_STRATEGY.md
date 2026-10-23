# Test Strategy

## Test layers

- Unit: pricing, validation, state transitions, ETA calculation.
- Service integration: HTTP routes, database operations, service client behavior.
- Contract: API response shapes and error codes.
- End-to-end: browse menu → place order → view tracking.
- Infrastructure: Docker Compose startup, container health, Helm lint/template, Terraform validation, Ansible syntax check.
- Security: SAST, dependency scan, secret scan, Trivy image scan.
- Load: repeatable lunch/dinner burst and controlled error-rate alert test.

## Mandatory Order Service test cases

1. Computes correct total from authoritative menu prices.
2. Ignores/rejects any client-supplied price/total.
3. Rejects zero, negative, fractional, or excessive quantities.
4. Rejects unknown menu items.
5. Rejects unavailable items.
6. Rejects invalid restaurant/menu combinations.
7. Prevents duplicate order creation for repeated idempotency key.
8. Returns existing result for a safe retry with the same key and payload.
9. Rejects reuse of idempotency key with a different payload.
10. Enforces valid status transitions.
11. Handles missing order with 404.
12. Handles menu service timeout/failure safely.
13. Preserves integer-paise calculations.
14. Emits expected metrics for success and failure.
15. Covers boundary conditions for maximum totals and quantities.

## Coverage policy

- The Order Service must achieve >=80% coverage according to the coverage tool configured in CI.
- Use coverage thresholds on statements/lines and preferably branches/functions too.
- Do not game coverage with meaningless tests. Test behavior and edge cases.
- If the tool reports coverage differently locally and in CI, make the CI command the source of truth and document it.

## Pull request checklist

- [ ] Tests added/updated.
- [ ] Order Service coverage remains >=80%.
- [ ] Lint/typecheck/build pass.
- [ ] API/docs updated if behavior changed.
- [ ] No secrets or sensitive logs.
- [ ] Container/security checks pass or exceptions documented.
- [ ] Pricing changes reviewed by a second person.
