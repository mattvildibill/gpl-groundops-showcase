# Weekend showcase review

Review baseline: `b0b8a438dff6c8146d30ad9f8f2cb3e2388fd6e1`.

The purpose remains a small, inspectable Java ground-operations integration exercise: plan → approval → event → task → audit → summary. Two independent reviews covered correctness/security and rendered UX. The work focuses on making that one story honest and usable, rather than adding production infrastructure.

## Decisions

- Keep the Java/Spring services, Artemis broker, contracts and Docker path. Add a distinct synthetic browser walkthrough for static hosting.
- Show the actual constraint policy and a direct link from an approval/task to its audit trace. Label browser-local time accurately; UTC remains the transport format.
- Replace operational readiness, JMS verification and telemetry claims with the quantities and behaviors implemented here.
- Surface failed requests and role permissions. An unavailable service must not look like an empty successful queue.
- Serialize approvals and leave failed publications retryable. Bind local ports to loopback; keep executive access read-only. Document the remaining non-atomic delivery boundary rather than claiming exactly-once processing.
- Patch vulnerable frontend dependencies without replacing the UI framework or adding infrastructure.

## Verification

Frontend production build and npm dependency audit run in this review. Browser checks are reproducible with the app running:

```bash
node scripts/verify-browser.mjs
```

The script checks the create/approve/task/audit flow, role changes, constraint feedback, audit-filter reset, summary, reset, direct routes, keyboard skip link and four viewport widths. It writes screenshots to `/tmp/gpl-browser-check` by default. Set `CHROMIUM_PATH` when Chromium is installed elsewhere.

Backend command attempted:

```bash
MAVEN_USER_HOME=/tmp/gpl-maven ./mvnw -Dmaven.repo.local=/tmp/gpl-maven/repository -q test
```

Dependency resolution was blocked before compilation by DNS failure for `repo.maven.apache.org`. The new publication-failure/concurrency tests and corrected Testcontainers fixture therefore remain unexecuted in this environment. Run the command on a machine with Maven Central access and Docker before treating the Java changes as verified. Docker Compose configuration validation passed.

## Remaining boundaries

In-memory records disappear on restart. Partial broker sends can produce duplicate or missing audit evidence; see [delivery limits](threat-model.md). The browser simulation is not an integration-test substitute. The static site has no authentication and no real operations data. Hosting and DNS still require coordination of the existing Vercel project and exact subdomain; no deployment is part of this review.
