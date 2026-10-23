# DevOps, CI/CD, Versioning, and Release Policy

## Branching and reviews

- Use trunk-based development with short-lived branches such as `feat/order-idempotency`.
- Protect `main` with required CI checks and PR review where repository settings permit.
- Pricing and order-total calculation changes require an explicit reviewer; record this in PR template and branch-protection guidance.
- Keep PRs small and merge frequently.

## Versioning

Use Semantic Versioning (`MAJOR.MINOR.PATCH`) for releases:
- MAJOR: incompatible API or data contract changes.
- MINOR: backward-compatible functionality.
- PATCH: backward-compatible bug/security fixes.

Tag releases `vX.Y.Z`. Attach commit SHA, image digest, test results, scan results, and deployment notes to the release.

## CI workflow stages

1. Checkout.
2. Set up pinned/runtime-supported Node version.
3. Install dependencies using lockfile (`npm ci` or package-manager equivalent).
4. Format/lint/typecheck.
5. Run unit and integration tests.
6. Enforce Order Service coverage >=80%.
7. Build all applications.
8. Run SAST and dependency vulnerability scanning.
9. Build container images.
10. Scan images with Trivy; block release on configured critical/high policy.
11. On approved release/tag only, authenticate with registry using secrets and push immutable version tags.
12. Publish test/coverage/scan artifacts.

Never expose secrets to untrusted fork PRs. Use least-privilege workflow permissions and pin third-party actions to reviewed versions/SHAs according to the team's policy.

## Image tags and retention

- Tag with release version and commit SHA; avoid `latest` as the sole deployment identifier.
- Deploy by digest where feasible.
- Keep the latest five release versions available for rollback.
- Prefer registry retention rules; otherwise document and test a safe cleanup script.
- Never delete an image still referenced by an active deployment.

## Canary rollout runbook

1. Confirm stable version and rollback target.
2. Deploy canary version with the ETA feature enabled.
3. Route 20% of eligible requests through the selected weighted-routing mechanism.
4. Observe request volume, 5xx/error rate, latency, and ETA correctness.
5. Promote only if acceptance thresholds remain healthy for the defined observation window.
6. Roll back immediately if errors exceed the threshold, readiness fails, or ETA behavior is incorrect.
7. Capture metrics and deployment revision in the report.

The implementation must define concrete thresholds and observation duration in the environment-specific runbook before demo day.
