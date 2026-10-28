# Threat model and delivery limits

GroundOps has two deliberately different execution modes. The hosted browser showcase uses synthetic scenarios and simulates tasking and audit events locally; its role picker is a demonstration control, not authentication. It does not connect to a broker or prove backend delivery. Do not enter sensitive information.

The Docker stack demonstrates REST/JMS boundaries on one developer machine. Published ports bind to `127.0.0.1`, including the broker console. This reduces accidental network exposure but is not a production security boundary.

## Local development security

- The UI deliberately knows the shared HS256 signing secret and can mint any demo role. Service role checks demonstrate authorization mechanics; they do not establish a trusted user identity. Never reuse this secret or expose these services publicly.
- Broker credentials are the documented `admin`/`admin` development defaults. Consumers validate required payload fields, not the authenticity of a mission or all domain semantics.
- Correlation IDs are client supplied or generated when absent. They aid tracing, but are neither proof of identity nor tamper-resistant evidence.
- Audit records have no modification API. They remain ordinary process memory, not an immutable or durable audit log.

## Failure and retry behavior

Planner approval is serialized so concurrent requests cannot both approve the same draft. The plan becomes approved only after the approval and audit sends return successfully. A send failure leaves it draft so the user can retry. Creation similarly adds the plan to the store only after its audit send succeeds.

Each outgoing event/audit pair is committed in one local JMS transaction. A controlled failure on the second send rolls back both. Ops records the task and plan-ID deduplication only after the outgoing pair commits, allowing retry after a failed publication.

This is **not an atomic transaction across memory, incoming acknowledgement and outgoing messages**. The outgoing transaction is independent of the listener acknowledgement. An ambiguous commit or process failure after publication can still produce duplicate evidence. Service restart loses plans, tasks, deduplication and audit records. Reused plan IDs after a Planner restart can also collide with a still-running Ops index. Do not treat this as restart-safe delivery or exactly-once processing.

The delayed-consumer scenario intentionally preserves the same running processes. A durable system would need durable mission/task identities and state, an outbox or equivalent delivery strategy, durable consumer idempotency and restart-recovery tests. None are claimed here. See [handoff test evidence](handoff-recovery.md).

## Out of scope

External identity providers, secret management, encryption at rest, tenancy, durable recovery, and real spacecraft constraints or telemetry. An unlinked hosted URL is still public; `noindex` discourages indexing but does not restrict access.
