# ADR 003: Service Boundaries and In-Memory Stores

## Status
Accepted

## Context
The showcase should feel like a real microservice system while staying small and runnable on a laptop.

## Decision
Split into three services with distinct responsibilities. Use in-memory stores for plans, tasks, and audit events.

## Consequences
- Boundaries and message contracts are visible and easy to reason about.
- No database setup required; the demo stays fast and free.
- Data resets on restart, which is acceptable for a showcase.
