# Hosted walkthrough and local engineering demo

GroundOps has two deliberately different execution modes. The Java services remain the engineering implementation; the static site makes the workflow inspectable without installing Docker.

| | Browser walkthrough (default) | Local services |
|---|---|---|
| Run | `cd web && npm ci && npm run dev` | `./scripts/run-local.sh` |
| Data | Synthetic inputs, memory in this tab | Synthetic inputs, service memory |
| Messaging | Synchronous simulation | Artemis JMS |
| Roles | UI exercise, not authentication | Locally minted development JWT |
| Reset | Refresh or Reset exercise | Restart services |
| Purpose | Explore the interaction and trace | Inspect Java integration and boundaries |

Set `VITE_DEMO_MODE=false` only when running the local services. Docker Compose already sets it. Do not configure hosted API URLs, JWT secrets, or expose the development broker to the internet. Vercel hosts the static walkthrough only; it does not run these Java services or verify JMS delivery.

All example assets, mission notes, roles and events are fictional. No orbital mechanics, spacecraft commanding, telemetry processing, station availability or real mission readiness is modeled. Approval coverage means approved plans divided by total plans, not operational readiness. A task copies the approved window; it does not execute it.

## Review the boundary

1. As PLANNER, submit a future 30-minute to 6-hour window within 14 days. CRITICAL requires at least 20 characters of justification.
2. Approve it. The approval trace and derived task share a correlation ID. Draft creation has its own request ID.
3. Select OPS and inspect the task, then AUDITOR and filter by the approval correlation ID.
4. Select EXEC for a read-only summary across the three views.
5. Try a past window, short critical justification, or a role without permission. Errors should explain the constraint rather than show fabricated success.

The browser model mirrors the main rules, but is not evidence that the Java services or broker have passed integration tests. See the test command and prerequisites in README.

## Hosting handoff

The root `vercel.json` builds `web/dist`, supports direct links to the four views, and sends `X-Robots-Tag: noindex, nofollow, noarchive`. Use the repository root as the Vercel project root. No server credentials or paid resources are needed.

Suggested hostname: `groundops.mattvildibill.com`, subject to the owner's existing-domain/project checks. Do not create a duplicate Vercel project or alter DNS until that target is confirmed. No navigation, sitemap, card or link on the main portfolio is required.

Unlinked and noindex are discoverability preferences, not access control. The showcase is public if deployed. No deployment or DNS change is performed by this repository configuration.
