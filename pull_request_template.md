# Pull Request Review & Pricing Policy

## Summary of Changes
<!-- Describe the changes and intent of this PR -->

## Pre-merge Checklist
- [ ] Added unit and integration tests covering positive and negative edge cases.
- [ ] Linters, typecheckers, and test suites pass locally.
- [ ] No secrets, private credentials, or live payment keys committed.
- [ ] Documentation updated in `docs/` where API contracts or architecture changed.

## Pricing & Order Total Safety Gate
> **CRITICAL REQUIREMENT:** Any modification to `services/order-service/src/domain.ts`, `services/order-service/src/menuResolver.ts`, or monetary calculations must be:
- [ ] Computed strictly in integer paise (no floating point arithmetic for currency).
- [ ] Approved by designated service owners before merging to `main`.
- [ ] Accompanied by order coverage tests maintaining >=80% coverage.
