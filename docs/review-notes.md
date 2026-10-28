# Weekend showcase review

Review baseline: `b0b8a438dff6c8146d30ad9f8f2cb3e2388fd6e1`.

The purpose remains a small, inspectable Java ground-operations integration exercise: plan → approval → event → task → audit → summary. Independent agents `/root/code_review` and `/root/ux_review` reviewed correctness/security and rendered UX respectively. The work focuses on making that one story honest and usable, rather than adding production infrastructure.

## Decisions

- Keep the Java/Spring services, Artemis broker, contracts and Docker path. Add a distinct synthetic browser walkthrough for static hosting.
- Show the actual constraint policy and a direct link from an approval/task to its audit trace. Label browser-local time accurately; UTC remains the transport format.
- Replace operational readiness, JMS verification and telemetry claims with the quantities and behaviors implemented here.
- Surface failed requests and role permissions. An unavailable service must not look like an empty successful queue.
- Serialize approvals and leave failed publications retryable. Bind local ports to loopback; keep executive access read-only. Document the remaining non-atomic delivery boundary rather than claiming exactly-once processing.
- Patch vulnerable frontend dependencies without replacing the UI framework or adding infrastructure.

## Verification

Frontend production build passed; npm audit reported zero vulnerabilities. The browser suite passed against both the development server and the built production bundle. Separate local-service-mode checks confirmed visible no-token and service-outage feedback. Browser checks are reproducible with the app running:

```bash
node scripts/verify-browser.mjs
```

The script checks the create/approve/task/audit flow, role changes, constraint feedback, audit-filter reset, summary, reset, direct routes, keyboard skip link and four viewport widths. It writes screenshots to `/tmp/gpl-browser-check` by default. Set `CHROMIUM_PATH` when Chromium is installed elsewhere.

Backend validation compiled all modules and passed three publication/concurrency unit tests plus the Artemis Testcontainers integration test (zero skipped). The integration test injects an approval event and checks the derived task/audit; it does not exercise planner HTTP approval end to end.

The initial direct Maven attempt could not resolve `repo.maven.apache.org`. The environment already supplies `HTTPS_PROXY`; using that existing proxy in a temporary Maven settings file restored access without permission or credential changes. Its Java 21 runtime includes the compiler module but omits `lib/ct.sym`, so `--release 21` failed. Validation used source/target 21 on that same Java 21 runtime:

```bash
MAVEN_USER_HOME=/tmp/gpl-maven JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw -s /tmp/gpl-maven-settings.xml \
  -Dmaven.repo.local=/tmp/gpl-maven/repository \
  -Dmaven.compiler.release= -Dmaven.compiler.source=21 -Dmaven.compiler.target=21 -q test
```

A subsequent standard verification used a complete matching Debian JDK 21 extracted in temporary storage. `clean test` passed all four tests with **no compiler overrides**:

```bash
MAVEN_USER_HOME=/tmp/gpl-maven JAVA_HOME=/tmp/gpl-full-jdk21 ./mvnw \
  -s /tmp/gpl-maven-settings.xml -Dmaven.repo.local=/tmp/gpl-maven/repository -q clean test
```

The repository still targets release 21. On a complete JDK 21 installation, use the standard `./mvnw test` command. Docker Compose configuration validation also passed. There is no current GitHub Actions workflow; commit `4d762733` deleted CI alongside its badge and the license, but supplies no rationale beyond its title. The earlier workflow ran standard Java21 tests and a frontend build. With no evidence explaining the deletion, this review did not silently restore it; standard JDK21 verification was performed locally instead. No full screen-reader audit or backend dependency vulnerability scan was performed.

## Remaining boundaries

In-memory records disappear on restart. Partial broker sends can produce duplicate or missing audit evidence; see [delivery limits](threat-model.md). The browser simulation is not an integration-test substitute. The static site has no authentication and no real operations data. Hosting and DNS still require coordination of the existing Vercel project and exact subdomain; no deployment is part of this review.

# Mission handoff expansion

Baseline: `4e230cadb590405f00cd1d65d82706d4b4f94060`. The bounded centerpiece is a mission timeline with a deliberately delayed Ops consumer, explicit pending approval, shared-consumer resume, and duplicate replay. [Demo and executable evidence](handoff-recovery.md).

Changes retain the three services and Artemis. Local JMS transactions group each outgoing event/audit pair; task deduplication is recorded only after publication succeeds. No database/outbox/service was added because the tested pause/resume scenario keeps processes alive. The broker-to-memory and incoming-acknowledgement boundaries remain non-atomic, explicitly documented in the threat model.

Independent code/security review identified a mismatch between per-plan browser recovery and a shared Java consumer, plus scenario visibility on role-denied pages. Both were corrected, with two-message queue/recovery coverage. Independent rendered UX review identified stale recovery notices and feedback leaking between missions; both were corrected, with mission-scoped feedback and browser regression checks. Reviewers found no backend transaction blocker or mobile overflow in the inspected flow.

Validation uses a complete matching JDK 21 and real Artemis containers, without compiler overrides. This environment requires its existing proxy plus a writable temporary Maven cache:

```bash
MAVEN_USER_HOME=/tmp/groundops-maven JAVA_HOME=/tmp/groundops-jdk21 ./mvnw \
  -s /tmp/groundops-maven-settings.xml -Dmaven.repo.local=/tmp/groundops-maven/repository -q clean test
```

The standard project command remains `./mvnw -q clean test`. The suite has seven tests: three planner unit cases, the original broker integration case, and three handoff/recovery integration cases. The controlled failure cases use spy-injected exceptions with real broker transactions; the Ops failure case calls TaskService directly, not the listener redelivery loop.

The frontend runtime is pinned to Node 22 in package engines and the local Docker image, matching the existing Vercel project setting. SPA routing and noindex are unchanged. No CI workflow or hosting/account/access configuration was added. Browser verification covers recovery, duplicate replay, two queued missions draining together, role-denied timeline hiding, mission-scoped feedback, and existing constraints/routes/responsive checks. Java integration and browser simulation evidence remain distinct.
