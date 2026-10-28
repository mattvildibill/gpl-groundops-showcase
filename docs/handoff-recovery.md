# One mission across a delayed handoff

This is a synthetic integration exercise, not an operational flight system. The hosted site runs a browser simulation. Java, Spring and Artemis execute only in the local stack and integration tests.

## Two-minute browser demo

1. As **PLANNER**, submit the prefilled coastal survey window. Review its time and priority.
2. Leave **Delay Ops consumption on approval** checked and approve. The timeline shows **Approved · awaiting handoff**, with no operations ticket. Approval is not completion.
3. Select **Resume Ops consumption**. The original approval yields one ticket, keeping the window and approval correlation ID.
4. Expand **Inspect handoff evidence** and replay duplicate delivery. The same ticket remains. Open the audit evidence and choose **AUDITOR** to inspect the approval and task events. Draft creation has a separate request trace.

The delay checkbox and resume/replay buttons are browser scenario controls, not Java management endpoints. Unchecking the delay exercises the normal delivery path when the shared consumer is running; an already paused consumer must still be resumed. No broker health or network failure is inferred from browser data.

## Why this mechanism

An approved message can wait in the existing Artemis queue while the Ops consumer is paused. Resuming consumption is the recovery action; reapproving would create a different request and is deliberately unnecessary. This bounded case needs neither another service nor a new database.

Inspection found two narrower correctness gaps worth fixing: Planner previously sent its approval and audit independently, and Ops recorded deduplication before publishing its task evidence. Each outgoing event/audit pair now uses a local JMS transaction. Ops updates its in-memory task index only after that publication succeeds, so a failed publication can be retried. The incoming acknowledgement and the outgoing transaction are separate; this is not a distributed transaction.

No persisted outbox is introduced. It would only be justified with durable mission/task state and explicit restart-recovery requirements, which this exercise does not claim. Ambiguous commit outcomes, process failure between broker commit and in-memory update, and service restart can still cause duplicate evidence or lost local state. Plan-ID deduplication lasts for one Ops process. The browser models this scoped guarantee, not exactly-once delivery.

## Real integration evidence

Run with a complete **JDK 21** and Docker:

```bash
./mvnw -q clean test
```

`HandoffRecoveryIntegrationTest` starts the actual three Spring services and a real Artemis Testcontainer. It covers:

- HTTP draft creation and approval while the Ops JMS listener is stopped; positive queue inspection proves two messages are pending and no task exists.
- Shared consumer resume drains both approvals; the selected task retains the approved window, plan ID and approval correlation. Audit reads use authenticated HTTP requests.
- Repeated JMS messages for the same plan; an ordered barrier message proves the consumer processed past both duplicates before task and audit counts are asserted.
- A controlled exception on the second Planner send; the first send rolls back, the draft remains retryable, and retry reaches Ops.
- A controlled exception on the second Ops send; no task/index entry or outgoing task event remains. This case invokes TaskService directly with a real JMS publisher; it does not assert listener redelivery. A later retry produces one event/audit pair; another call reuses the same task.

The exception cases inject failure at the publisher boundary while using the real broker transaction. They do not simulate a network partition or prove restart durability. The original integration test and publication/concurrency unit tests remain.

Browser verification (with the web app running):

```bash
node scripts/verify-browser.mjs
```

This checks pending/recovery/duplicate replay as well as the existing constraint, role, audit, direct-route and responsive checks. It is separate evidence from the Java suite.

## Reproduce the delay with Docker

Start a fresh local scenario with `./scripts/run-local.sh`, choose PLANNER and create a draft. Before approving:

```bash
docker compose -f infra/docker-compose.yml pause ops-service
```

Approve the plan. Planner can accept the approval while Ops cannot consume it. The local UI does not expose the synthetic timeline or consumer controls; a paused Ops HTTP request may remain pending. Inspect the `groundops.events.plan-approved.v1` queue in the local Artemis console to observe the waiting message. Resume the existing process:

```bash
docker compose -f infra/docker-compose.yml unpause ops-service
```

Choose OPS and inspect the ticket, then AUDITOR for its correlation trace. Pause/unpause preserves process memory; stopping/recreating Ops would lose its deduplication state. Do not leave the service paused when ending the exercise.
