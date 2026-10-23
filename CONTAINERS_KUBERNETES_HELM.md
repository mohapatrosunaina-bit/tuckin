# Containers, Kubernetes, and Helm

## Container requirements

- Multi-stage builds for frontend and every service.
- Minimal runtime image; run as non-root where feasible.
- Pin base image versions and use lockfiles.
- Add `.dockerignore`; do not copy `.env`, `.git`, test output, or local data into images.
- Expose only required ports.
- Add container health checks where supported.
- Set CPU/memory requests and limits in Kubernetes.
- Run Trivy before images are eligible for registry publication.

## Kubernetes objects

For each application component:
- Deployment
- ClusterIP Service
- ConfigMap for non-sensitive configuration
- Secret references for sensitive values (do not store real secret values in Git)
- Liveness and readiness probes
- Resource requests/limits
- Labels/selectors that are stable and consistent

Platform:
- Ingress routing customer and restaurant traffic appropriately.
- HPA for Order Service.
- Metrics Server (required for CPU-based HPA) or another explicitly configured metrics adapter.
- Prometheus/Grafana deployment or documented supported chart.
- Network policies only if supported by the cluster and demonstrable in the assignment.

## ConfigMaps and Secrets

Use ConfigMaps for delivery-zone settings and non-sensitive feature configuration. Use Kubernetes Secrets as references for mock payment keys in local/demo clusters, and GitHub Secrets or Vault for CI/real credentials. Kubernetes Secret values are not automatically encrypted merely because they are base64 encoded; follow cluster-specific secret-management guidance.

## Helm

- One chart packages the app.
- `values.yaml` contains safe defaults.
- `values-dev.yaml`, `values-staging.yaml`, and `values-prod.yaml` contain non-secret environment overrides.
- Do not commit real secrets or production tfvars.
- Add resource names/labels, probes, resource settings, image registry/repository/tag, ingress settings, and HPA settings as values.
- Include README install/upgrade/rollback commands.

Validation:
- `helm lint ./helm/food-delivery`
- `helm template demo ./helm/food-delivery -f ./helm/food-delivery/values-dev.yaml`
- `kubectl get deploy,svc,ingress,hpa -n <namespace>`
- Verify readiness, route behavior, and HPA metrics after deployment.

## HPA demo

1. Record baseline replicas and resource usage.
2. Generate a repeatable burst against the Order Service.
3. Observe HPA desired/current replicas and pod readiness.
4. Continue load long enough for metrics and scale decisions to update.
5. Stop load and observe scale-down, respecting stabilization windows.
6. Report observed behavior, cluster limitations, and evidence.

Do not promise autoscaling in a cluster without a working metrics source.
