# ADR 002: Local JWT for Role-Based Access

## Status
Accepted

## Context
Endpoints should be protected with roles (PLANNER, OPS, AUDITOR, EXEC), but a full IdP is out of scope for a free, local demo.

## Decision
Use HS256-signed JWTs with a shared dev secret. Provide a script and UI role switcher to mint tokens locally.

## Consequences
- Reviewers can exercise access controls without extra services.
- The secret is not production-grade and is clearly labeled “local dev only.”
- The pattern mirrors real RBAC while keeping setup friction low.
