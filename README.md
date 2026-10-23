# Food Delivery Platform — Antigravity Handoff

**Team:** Team 5  
**Project:** Food Delivery / Restaurant Ordering Platform  
**Purpose:** A working, demonstrable application whose primary learning outcomes are DevOps, CI/CD, containerization, Kubernetes, IaC, observability, and DevSecOps.

## How to use this package

1. Create a GitHub repository (suggested name: `food-delivery-platform`).
2. Unzip this package into the repository root.
3. Open/clone the repository in Antigravity.
4. Read `AGENTS.md` first. Then ask the agent to execute **one milestone at a time** from `docs/IMPLEMENTATION_PLAN.md`.
5. Review the diff, run the validation commands, and commit each accepted milestone.
6. Do not ask the agent to build the whole platform in one prompt. The project has explicit gates to keep the implementation testable.

## Start here

- [`AGENTS.md`](AGENTS.md): instructions for the coding agent.
- [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md): assignment requirements translated into engineering outcomes.
- [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md): MVP scope and acceptance criteria.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): initial system design.
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md): ordered implementation milestones.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): decisions and assumptions to keep consistent.

## Product strategy

Build a **small, coherent modular application** with distinct Restaurant, Order, and Delivery Tracking services. The goal is not to imitate all of Uber Eats. The goal is to make the end-to-end order journey real enough to exercise deployment and operations.

### Proposed initial stack

- Frontend: React + TypeScript + Vite
- Services: Node.js + TypeScript + Express
- Persistence: PostgreSQL for core order/menu data; keep local development simple with Docker Compose
- Tests: Vitest/Jest, Supertest, Playwright (only once the end-to-end flow exists)
- Local runtime: Docker Compose
- CI: GitHub Actions
- Image scanning: Trivy
- Orchestration: Kubernetes + Helm
- IaC: Terraform, environment-specific `.tfvars.example` files
- Configuration automation: Ansible for a safe, scheduled log-retention job
- Metrics: Prometheus + Grafana
- Load generation: k6 or a small repeatable load script

This is a recommendation, not a mandate from the brief. If the course environment specifies another stack, update `docs/DECISIONS.md` before implementation.

## Definition of done

The project is done when:
1. A user can browse a menu, place an order, and view simulated delivery status.
2. Restaurant staff can view and update order status through a simple management view.
3. The order service has meaningful automated tests and at least 80% coverage.
4. CI runs tests, coverage, build, static checks, and security scanning.
5. Docker Compose runs the local system reproducibly.
6. Kubernetes manifests and Helm install the platform across dev/staging/prod configurations.
7. Order Service HPA behavior is demonstrated under generated load.
8. Canary rollout of the estimated-delivery-time feature routes 20% of eligible traffic to the canary and documents how to observe and roll back it.
9. Prometheus/Grafana show throughput, delivery-time trends, and error rate; an alert fires during a deliberately induced failure-rate spike.
10. Terraform, Ansible, image scanning, secrets handling, and the lunch-hour load report are documented and reproducible.
