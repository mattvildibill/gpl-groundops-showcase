# Demo walkthrough

## First minute: browser simulation

No role knowledge or infrastructure is needed. The hosted site stores fictional records in browser memory and clears them on refresh.

1. In **Mission workspace**, choose **Save mission**. The example coastal survey is ready to try; **Edit mission details** exposes all inputs and window rules.
2. In the adjacent progress panel, leave **Try a delivery delay** checked and choose **Approve mission**.
3. Read **Approved · awaiting handoff**. The receiving service is paused and no ticket exists yet. Choose **Resume delivery**.
4. Inspect the ticket in that same panel. Choose **Try duplicate delivery**: the same ticket remains.
5. Expand **History & technical evidence** for timestamps and the correlation ID. **Open audit evidence** shows the related approval and task records.

Normal navigation selects the matching simulated persona. Visitors never need to match a role to a page. **How it works & technical controls** exposes manual role overrides for exploring permission denials. This is browser orchestration, not authentication or a live broker.

Use **New mission** to create another request. Returning to the workspace restores the current mission view. At small widths, the current action comes before completed details; keyboard focus follows save, approval and recovery.

## Local Java / Artemis demonstration

Run `./scripts/run-local.sh` and open http://localhost:5173. In **How it works & technical controls**, choose PLANNER to mint a local development JWT. Local mode retains explicit role selection and actual service authorization.

Save and approve a mission. Choose OPS before opening **Operations tickets**, EXEC before **Overview**, or AUDITOR before **History & evidence**. Copy the approval correlation ID to inspect its event chain. Approval coverage does not claim spacecraft readiness or survey completion.

To reproduce delayed consumption with the existing Docker stack, follow [the pause/resume instructions and integration-test evidence](handoff-recovery.md). The hosted scenario controls are not Java management endpoints.

Optional: `./scripts/seed-demo.sh` creates two local plans and approves one.
