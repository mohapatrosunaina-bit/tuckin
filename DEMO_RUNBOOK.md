# Demo Runbook

## Demo narrative

1. Show the product: browse a restaurant menu and place an order.
2. Show the restaurant operator view and progress the order.
3. Show the delivery simulator and explain that tracking is simulated.
4. Show the CI workflow and Order Service coverage gate.
5. Show a versioned image and Trivy scan results.
6. Deploy stable version, then demonstrate ETA feature canary at 20% using the actual configured weighted-routing mechanism.
7. Show Prometheus/Grafana throughput, delivery-time trends, and failure-rate alert.
8. Generate a lunch-hour traffic burst and show HPA scale-up/scale-down behavior.
9. Show Helm values for dev/staging/prod.
10. Show Terraform environment separation and Ansible log-retention schedule.
11. End with the load-test report and known limitations.

## Pre-demo checklist

- [ ] Local demo path works from a clean start.
- [ ] Seed data is deterministic.
- [ ] Demo credentials are fake and documented.
- [ ] CI is green on the exact commit being presented.
- [ ] Images are tagged and scan results available.
- [ ] Kubernetes cluster and metrics source are healthy.
- [ ] Canary route split is verified with measured requests.
- [ ] Rollback command is tested.
- [ ] Grafana dashboard is populated with real test data.
- [ ] Alert can be triggered safely and recovery is visible.
- [ ] Screenshots/logs are captured as evidence.
- [ ] Load report contains measured data and limitations.

## Rollback principle

Prefer a documented Helm rollback to the known-good release for the demo. Confirm application readiness and error metrics after rollback. Never test rollback for the first time in front of evaluators.
