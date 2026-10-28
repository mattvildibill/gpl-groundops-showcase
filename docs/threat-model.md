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

This is **not an atomic transaction** across state and messages. A partial send or ambiguous broker acknowledgement can deliver an event before the HTTP operation fails; retry can publish it again with another correlation ID. Ops deduplicates tasks by plan ID within one process, but does not guarantee exactly-once events. Its current task index is updated before its outgoing sends: a failure there can leave a task without its corresponding audit record. Service restart also loses plans, task deduplication state and audit records.

These limits are intentional scope boundaries for a small demonstration, not guarantees hidden behind the UI. A durable system would need persisted state, a transactional outbox or equivalent delivery strategy, consumer idempotency, and recovery tests. None are claimed here.

## Out of scope

External identity providers, secret management, encryption at rest, tenancy, durable recovery, and real spacecraft constraints or telemetry. An unlinked hosted URL is still public; `noindex` discourages indexing but does not restrict access.
