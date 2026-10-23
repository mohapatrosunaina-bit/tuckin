# Canary Rollout & Validation Runbook

This document details the concrete 20% traffic splitting mechanism, automated validation, and instant rollback procedures for the new Estimated Delivery Time (ETA) model in `delivery-service`.

## 1. Architectural Routing Mechanism

Canary traffic splitting is managed by the **Nginx Ingress Controller** via annotations:
- `nginx.ingress.kubernetes.io/canary: "true"`
- `nginx.ingress.kubernetes.io/canary-weight: "20"`

### Stable vs. Canary Version Characteristics
| Attribute | Stable Version (`v1`) | Canary Version (`v2-canary`) |
|---|---|---|
| Deployment | `delivery-service` | `delivery-service-canary` |
| Image Tag | `latest` (or release semver) | `v0.2.0-canary` |
| Feature Flag | `FEATURE_AI_ETA_ENABLED=false` | `FEATURE_AI_ETA_ENABLED=true` |
| HTTP Header | `x-track-version: v1-stable` | `x-track-version: v2-canary-eta` |
| Response Payload | `{ orderId, status, estimatedDeliveryMinutes }` | Includes `etaModel: "ai-traffic-aware-v2"` & `confidenceScore` |

---

## 2. Canary Deployment Procedure

To deploy the canary release:
```bash
helm upgrade tuckin ./helm/tuckin -f ./helm/tuckin/values-canary.yaml
```

Verify both deployments are active:
```bash
kubectl get deployment -l app=delivery-service
# Output:
# tuckin-delivery-service           2/2
# tuckin-delivery-service-canary    1/1
```

---

## 3. Empirical Traffic Distribution Validation (20% Gate)

Send 100 sample requests through the ingress and inspect the distribution of `x-track-version`:
```bash
STABLE_COUNT=0
CANARY_COUNT=0

for i in {1..100}; do
  TRACK=$(curl -sI http://tuckin.local/api/delivery/sample-order | grep -i "x-track-version" | awk '{print $2}' | tr -d '\r')
  if [[ "$TRACK" == *"v2-canary-eta"* ]]; then
    CANARY_COUNT=$((CANARY_COUNT + 1))
  else
    STABLE_COUNT=$((STABLE_COUNT + 1))
  fi
done

echo "Traffic Split Results: Stable: ${STABLE_COUNT}%, Canary: ${CANARY_COUNT}%"
```
**Acceptance Threshold:** Canary must receive between 15% and 25% of requests over 100 samples (nominal 20%).

---

## 4. Promotion & Rollback Runbook

### Case A: Canary Passes (Promotion)
Update base `values.yaml` to the new image tag and disable the canary block:
```bash
helm upgrade tuckin ./helm/tuckin --set deliveryService.image.tag=v0.2.0 --set canary.enabled=false
```

### Case B: Canary Anomaly / Elevated 5xx (Instant Rollback)
If error rates rise or latency spikes exceed the SLO, immediately disable canary routing:
```bash
helm upgrade tuckin ./helm/tuckin --set canary.enabled=false
```
Verify that all canary ingress resources are detached:
```bash
kubectl get ingress
```
All traffic instantly reverts 100% to stable `v1` with zero downtime.
