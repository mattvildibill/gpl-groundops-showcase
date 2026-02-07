#!/usr/bin/env bash
set -euo pipefail

UI_URL="${UI_URL:-http://localhost:5173}"
STACK_MODE="${STACK_MODE:-auto}"

wait_for() {
  local url="$1"
  local name="$2"
  for _ in {1..40}; do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "$name ready"
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for $name ($url)"
  exit 1
}

if [[ "$STACK_MODE" != "skip" ]]; then
  if ! curl -sf "$UI_URL" >/dev/null 2>&1; then
    echo "Starting local stack via docker compose..."
    if docker compose version >/dev/null 2>&1; then
      docker compose -f infra/docker-compose.yml up -d --build
    else
      docker-compose -f infra/docker-compose.yml up -d --build
    fi
  fi
fi

wait_for "$UI_URL" "UI"
wait_for "http://localhost:8080/actuator/health" "planner-service"
wait_for "http://localhost:8081/actuator/health" "ops-service"
wait_for "http://localhost:8082/actuator/health" "audit-service"

./scripts/seed-demo.sh || true

npm --prefix web install
npx --prefix web playwright install chromium

UI_URL="$UI_URL" node scripts/capture-demo.mjs

echo "Demo GIF captured in docs/screenshots/demo.gif"
