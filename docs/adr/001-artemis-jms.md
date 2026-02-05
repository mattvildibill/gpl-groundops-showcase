# ADR 001: Use ActiveMQ Artemis with JMS

## Status
Accepted

## Context
The showcase needs asynchronous, event-driven messaging with minimal operational overhead. The goal is to demonstrate real boundaries (planner → ops → audit) without introducing a paid service or complex streaming stack.

## Decision
Use **ActiveMQ Artemis** in Docker and publish/consume via **Spring JMS**.

## Consequences
- JMS keeps event boundaries explicit and readable for reviewers.
- Artemis runs locally and starts quickly with Docker.
- Throughput and partitioning are not the focus; the design is intentionally simple.
