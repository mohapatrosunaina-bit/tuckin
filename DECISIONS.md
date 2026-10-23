# Architecture Decision Log

Record changes here when requirements, environment, or design choices change.

## ADR-001 — Keep scope focused
**Status:** Accepted  
**Decision:** Implement only the customer ordering, restaurant order management, and simulated delivery journey.  
**Reason:** The assignment is assessed heavily on DevOps outcomes; product scope must stay small enough to deliver and validate the operational features.

## ADR-002 — TypeScript modular services
**Status:** Proposed  
**Decision:** Use React + TypeScript and Node.js + TypeScript/Express for the frontend and three application services.  
**Reason:** The assignment permits Node.js/Express, and a shared language reduces context-switching. Change this if the course/lab requires Java/Spring Boot.

## ADR-003 — Integer paise for money
**Status:** Accepted  
**Decision:** Store and calculate money as integer paise.  
**Reason:** Avoid floating-point rounding errors and make pricing tests precise.

## ADR-004 — Mock payments only
**Status:** Accepted  
**Decision:** Do not integrate a real payment gateway. Use clearly labelled mock payment states and fake keys only.  
**Reason:** Real payments add compliance/security scope unrelated to the core assignment.

## ADR-005 — Canary routing must be real
**Status:** Accepted  
**Decision:** Use a concrete weighted-routing mechanism and verify distribution empirically; replica ratios alone are insufficient.  
**Reason:** The brief explicitly asks for 20% of users to receive the new ETA feature.

## ADR-006 — Infrastructure target must be chosen before Terraform implementation
**Status:** Open  
**Decision needed:** Which target environment is available (local lab, AWS, Azure, GCP, or another provider)?  
**Reason:** Terraform resources, credentials, cost, and reproducibility depend on the actual target. Start with provider-neutral module structure and do not run cloud provisioning until approved.

## ADR-007 — Persistence target
**Status:** Proposed  
**Decision:** Use PostgreSQL for durable order/menu data in local and Kubernetes environments, unless the assignment environment makes this impractical.  
**Reason:** It gives a realistic persistence layer while remaining easy to run in Docker Compose.
