# ADR 004: Separate Vite + React Frontend

## Status
Accepted

## Context
A polished UI is a primary requirement, and it should be easy to iterate independently from the services.

## Decision
Build the UI as a separate Vite + React + Tailwind app.

## Consequences
- Faster UI iteration and isolated tooling.
- Clear separation between frontend and service APIs.
- Docker Compose runs the UI alongside services for a single-command demo.
