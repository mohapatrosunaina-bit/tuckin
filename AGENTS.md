# Agent Instructions

You are the implementation agent for this repository. Follow these rules before editing code.

## Operating rules

1. Read `README.md` and the relevant files in `docs/` before starting a milestone.
2. Work in **small, reviewable increments**. Never scaffold every phase at once.
3. First inspect the existing repository and report what exists. Do not overwrite working code or user files.
4. Before implementing, state: goal, files likely to change, risks, and validation commands.
5. After implementation, run the relevant tests, linters, type checks, and build. Report exact commands and results; never claim a command passed if it was not run.
6. Update documentation when behavior, API contracts, environment variables, or deployment behavior changes.
7. Prefer boring, supported, maintainable choices over clever abstractions.
8. Keep business logic testable and independent of HTTP handlers where practical.
9. Do not hard-code credentials, tokens, private endpoints, payment details, or production data.
10. Never run destructive cloud commands, Terraform apply/destroy, production deployment, secret rotation, or repository history rewrites without explicit human approval.
11. Do not commit, push, open PRs, or merge unless the user explicitly asks.
12. Do not add a real payment integration. Use a clearly labelled mock payment outcome.
13. Keep the system intentionally small. Do not add Kafka, service mesh, Redis, or extra microservices unless the brief cannot be met without them.
14. Do not claim a canary rollout is real if it only changes a UI label. Document the actual routing mechanism and limitations.
15. Keep generated files and dependencies minimal. Avoid committing `.env`, credentials, local databases, build output, or generated secrets.

## Required workflow for every milestone

1. Inspect the relevant files.
2. Summarize intended change and acceptance criteria.
3. Implement only that milestone.
4. Run validation commands.
5. Inspect the diff for accidental changes, secrets, TODO placeholders, and inconsistent names.
6. Update `docs/PROGRESS.md` with completed work, validation results, and blockers.
7. Present a concise handoff: changed files, commands run, results, and next milestone.

## Project-specific invariants

- Services: `restaurant-service`, `order-service`, `delivery-service`, and `frontend`.
- Order statuses: `PLACED`, `ACCEPTED`, `PREPARING`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`.
- Money is represented as integer paise in the API/database; never use floating-point arithmetic for totals.
- Server-side order totals must be computed from trusted menu data, not from client-supplied prices.
- Every order has a stable ID, creation timestamp, status, items, amount, and simulated delivery estimate.
- Health endpoints: `/health/live` and `/health/ready`.
- Metrics endpoint: `/metrics` on services that expose Prometheus metrics.
- All service-to-service endpoints must be configurable through environment variables.
- Mock data and seed scripts must be deterministic and safe to run repeatedly.

## First prompt to the agent

> Read `AGENTS.md`, `README.md`, `docs/PROJECT_BRIEF.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/IMPLEMENTATION_PLAN.md`. Inspect the repository without modifying files. Report the current state, identify conflicts between existing files and the handoff, and propose the smallest first milestone with acceptance criteria and validation commands. Do not implement anything yet.
