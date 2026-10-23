# Implementation Plan — Milestone Gates

Build in this order. Each milestone should end with tests and a reviewable commit. Do not start the next milestone while the current one has failing acceptance criteria.

## M0 — Repository and decisions
- Inspect current repository and confirm stack.
- Add `AGENTS.md`, docs, `.gitignore`, editor config, license if appropriate.
- Establish branch/PR and release-tag conventions.
**Gate:** clean repository; decisions recorded; no secrets.

## M1 — Domain contracts and service skeletons
- Scaffold frontend and three Node/TypeScript services.
- Add health endpoints, shared error format, environment validation, request IDs.
- Add OpenAPI contract files or equivalent route documentation.
**Gate:** each service builds and health endpoints respond.

## M2 — Restaurant menu and frontend browse
- Add deterministic restaurant/menu seed data.
- Implement menu API and responsive customer browse view.
**Gate:** API tests and browser/manual check show menu data.

## M3 — Order Service correctness first
- Implement validation, server-side totals, integer paise, idempotency, persistence, status transitions.
- Add unit and integration tests before adding features.
- Add coverage report and enforce >=80% Order Service coverage.
- Configure PR review protection/documentation for pricing changes.
**Gate:** tests cover happy path, bad inputs, invalid transitions, duplicate retries, unavailable items, and total calculation.

## M4 — Delivery simulation and restaurant operations
- Implement simulated delivery milestones/ETA.
- Implement restaurant operator view and order status actions.
- Wire full customer → order → delivery flow.
**Gate:** automated end-to-end flow browse → place → track succeeds.

## M5 — Local reproducibility and containerization
- Multi-stage Dockerfiles for each service/frontend.
- Docker Compose for app services and database.
- Health checks, non-root runtime where feasible, `.dockerignore`.
- Trivy image scans; document acceptable findings and fail on agreed severity.
**Gate:** a fresh clone can run the stack from documented commands.

## M6 — GitHub Actions CI
- Pull request workflow: install, lint, typecheck, unit/integration tests, coverage gate, build, SAST, dependency scan.
- Build versioned images on release/tag.
- Scan images before pushing to registry.
- Use least-privilege permissions and repository secrets for registry auth.
- Define retention of last five release image versions using registry cleanup policy or documented manual policy.
**Gate:** PR workflow fails on tests/coverage/critical scan failures and release image tags are traceable.

## M7 — Kubernetes and Helm
- Deploy each service separately.
- Add Services, Ingress, ConfigMaps, Secret references, resource requests/limits, probes.
- Add Order Service HPA and document metrics-server requirements.
- Helm chart with environment values for dev/staging/prod.
**Gate:** Helm lint/template succeeds; deploy to available local/lab cluster; verify routes and scaling.

## M8 — Canary rollout
- Add the estimated-delivery-time feature behind a versioned config/feature flag.
- Choose a real weighted-routing mechanism supported by the environment.
- Route 20% of eligible traffic to canary; collect success/error/latency metrics.
- Document promote and rollback steps.
**Gate:** test evidence demonstrates traffic distribution and rollback restores stable version.

## M9 — Observability and peak-load exercise
- Instrument request count, errors, latency, orders placed, and delivery duration.
- Configure Prometheus scrape targets and Grafana dashboard.
- Add alert rule for elevated order failure rate.
- Run a repeatable lunch-hour load test and capture HPA/pod/latency observations.
**Gate:** dashboard has real metrics; alert can be deliberately triggered; report includes evidence and limitations.

## M10 — Terraform and Ansible
- Terraform modules/resources matched to the actual lab/cloud target; separate example tfvars for dev/staging/prod.
- Never commit real state, credentials, or sensitive tfvars.
- Ansible playbook and timer/cron setup for retention of old delivery logs, with dry-run and retention validation.
**Gate:** `terraform fmt -check`, `terraform validate` (after init/provider setup), Ansible syntax check, and safe test run documented.

## M11 — Final hardening and presentation
- Verify no secrets in Git history/current files.
- Run end-to-end tests, image scans, Helm checks, and load scenario.
- Capture architecture, pipeline, canary, dashboard, alert, HPA, and security evidence.
- Write `docs/LOAD_TEST_REPORT_TEMPLATE.md` with actual results filled in; never fabricate measurements.
**Gate:** every assignment deliverable has evidence, commands, and a concise explanation.

## Suggested working rhythm

For every milestone: agent proposes → human approves scope → agent implements → tests run → inspect diff → commit. Keep one feature per PR where possible. Prefer trunk-based development with short-lived branches and frequent integration.
