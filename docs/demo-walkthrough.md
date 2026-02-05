# Demo Walkthrough

This script mirrors what a recruiter or reviewer should do in a 5–7 minute walkthrough.

## 1) Start the stack
```bash
./scripts/run-local.sh
```
Open the UI at http://localhost:5173.

## 2) Choose a role
Select **PLANNER** in the top-right role switcher. The UI mints a local dev JWT and stores it in the browser.

## 3) Create and approve a plan
- Fill out the mission window form.
- Submit the plan. Notice constraint feedback if the window is invalid.
- Click **Approve** on the draft plan.

Expected:
- `PlanApproved.v1` is published.
- Ops task appears within ~5 seconds.
- Audit trail adds entries.

## 4) Verify Ops Tasking
Switch to **Ops Tasking**. Select the newly created tasking ticket and copy the correlation ID.

## 5) Verify Executive Summary
Switch to **Executive Summary**. Readiness and “What changed” feed should reflect your actions.

## 6) Inspect Audit Trail
Switch to **Audit Trail**. Paste the correlation ID to filter down to the exact flow.

## Optional: seed demo data
```bash
./scripts/seed-demo.sh
```
This creates two plans and approves one of them.
