# Chaos Engineering Tests

This directory contains Chaos Mesh experiments for testing system resilience.

## Prerequisites

- Kubernetes cluster (v1.18+)
- Helm 3+
- kubectl configured

## Installation

```bash
chmod +x install.sh
./install.sh
```

## Experiments

### Network Latency Test
Tests system behavior under high latency conditions (100ms delay).

```bash
kubectl apply -f chaos-experiments.yaml -l experiment=network-latency
```

### Network Partition Test
Simulates network partition between services.

```bash
kubectl apply -f chaos-experiments.yaml -l experiment=network-partition
```

### Pod Kill Test
Tests recovery when pods are forcefully terminated.

```bash
kubectl apply -f chaos-experiments.yaml -l experiment=pod-kill
```

### Pod Failure Test
Tests graceful handling of pod failures.

```bash
kubectl apply -f chaos-experiments.yaml -l experiment=pod-failure
```

### CPU Stress Test
Tests system under high CPU load.

```bash
kubectl apply -f chaos-experiments.yaml -l experiment=cpu-stress
```

## Monitoring

Access Chaos Mesh dashboard:
```bash
kubectl port-forward -n chaos-mesh svc/chaos-dashboard 2333:2333
```

Then visit: http://localhost:2333

## Recovery Procedures

### If Backend is Unresponsive

1. Check pod status:
```bash
kubectl get pods -l app=scoopdope-backend
```

2. Check logs:
```bash
kubectl logs -l app=scoopdope-backend --tail=100
```

3. Restart deployment:
```bash
kubectl rollout restart deployment/scoopdope-backend
```

### If Database Connection is Lost

1. Check PostgreSQL pod:
```bash
kubectl get pods -l app=postgres
```

2. Verify PVC:
```bash
kubectl get pvc
```

3. Restart PostgreSQL:
```bash
kubectl rollout restart deployment/postgres
```

### If Redis is Unavailable

1. Check Redis pod:
```bash
kubectl get pods -l app=redis
```

2. Clear Redis cache:
```bash
kubectl exec -it <redis-pod> -- redis-cli FLUSHALL
```

3. Restart Redis:
```bash
kubectl rollout restart deployment/redis
```

## Findings & Mitigations

The chaos engineering experiments surface resilience gaps and confirm recovery behavior for critical failure classes.

### Database Failure
- Finding: A PostgreSQL pod failure should lead the backend health check to return `503` rather than crash the service.
- Mitigation: Use PodChaos on the `postgres` deployment and confirm failover behavior with readiness probes and deployment restart policies.

### Redis Outage
- Finding: Redis unavailability must not block core course and health endpoints.
- Mitigation: Configure cache fallbacks and ensure the backend returns cached or degraded responses when Redis is down.

### Network Partition
- Finding: Intermittent network partitions should be visible through higher latency and rejected requests, not complete service failure.
- Mitigation: Use retry logic, timeouts, and circuit breaker patterns so the backend degrades gracefully during isolated network outages.

These documented mitigations improve platform reliability and provide a starting point for staging chaos drills.

## Cleanup

Remove all chaos experiments:
```bash
kubectl delete -f chaos-experiments.yaml
```

Uninstall Chaos Mesh:
```bash
helm uninstall chaos-mesh -n chaos-mesh
kubectl delete namespace chaos-mesh
```
