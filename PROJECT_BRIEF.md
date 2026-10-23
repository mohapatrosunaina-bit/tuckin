# Project Brief — Assignment Requirements

## Source of truth

This document transcribes the supplied Team 5 brief for **Project 5: Food Delivery / Restaurant Ordering Platform**. If this conflicts with a later instructor clarification, record the clarification in `DECISIONS.md` and update affected documents.

## Overview

A food ordering platform connects customers, restaurants, and delivery tracking. Traffic is naturally bursty around lunch and dinner, making the platform useful for demonstrating deployment strategies and autoscaling under time-based demand patterns.

## Application architecture requirements

- Customer-facing ordering application.
- Restaurant-facing order-management view.
- Restaurant Service: manages restaurant menus and availability.
- Order Service: handles order placement and status updates.
- Delivery Tracking Service: simulates live delivery status updates.

## Phase 1 — Version control

- Use trunk-based development for Order Service to support frequent, small changes.
- Require pull-request review for changes to pricing or order-total calculation logic.
- Tag releases clearly (for example, `v1.2.0`) so incidents can be traced to an exact release.

## Phase 2 — CI/CD

- Automated tests simulate the full order flow: browse menu → place order → track delivery.
- Code-quality gate requires at least 80% test coverage for Order Service specifically.
- Push Docker images to a registry tagged by version and retain the last five versions for quick rollback.
- Demonstrate canary deployment of a new estimated-delivery-time feature, initially rolling it out to 20% of users.

## Phase 3 — Containerization

- Dockerfile for each service, using multi-stage builds to keep runtime images minimal.
- Docker Compose runs Restaurant + Order + Delivery Tracking together locally.
- Scan all images with Trivy before they are allowed into the CI artifact registry.

## Phase 4 — Orchestration

- Each service is a separate Kubernetes Deployment.
- Use Ingress to route customer vs restaurant traffic appropriately.
- Use ConfigMaps for delivery-zone settings and Secrets for third-party payment gateway keys (mock keys are acceptable).
- Configure HPA on Order Service to simulate lunch/dinner traffic spikes and demonstrate scale-up and scale-down.
- Use Helm to package the platform for repeatable dev/staging/prod installs.

## Phase 5 — IaC, monitoring, and DevSecOps

- Provision infrastructure with Terraform, using separate `.tfvars` files for dev, staging, and production.
- Use Ansible to set up a scheduled job that cleans up old delivery-tracking logs.
- Monitor order throughput, average delivery time, and error rate using Prometheus + Grafana.
- Set an alert rule for a failure-rate spike during peak hours, simulating an on-call scenario.
- Store payment gateway keys in Vault or GitHub Secrets.
- Run a basic SAST scan on Order Service pricing logic.

## Key deliverables

1. Working ordering platform with simulated end-to-end order flow.
2. CI/CD pipeline with a documented canary rollout of a new feature.
3. Helm chart supporting dev/staging/prod deployment.
4. Grafana dashboard for order throughput and delivery-time trends.
5. Short report on response to a simulated lunch-hour traffic spike.

## Suggested stack

Node.js/Express or Spring Boot, Docker, Kubernetes, Helm, Terraform, Ansible, Prometheus, Grafana, Trivy, and GitHub Actions or Jenkins.
