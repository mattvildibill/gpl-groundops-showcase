#!/usr/bin/env bash
set -euo pipefail

UI_URL="${UI_URL:-http://localhost:5173}"
STACK_MODE="${STACK_MODE:-auto}"

if [[ "$STACK_MODE" != "skip" ]]; then
  if ! curl -s "$UI_URL" >/dev/null 2>&1; then
    echo "Starting local stack via docker compose..."
    if docker compose version >/dev/null 2>&1; then
      docker compose -f infra/docker-compose.yml up -d --build
    else
      docker-compose -f infra/docker-compose.yml up -d --build
    fi
  fi
fi

echo "Waiting for UI to be ready..."
for i in {1..40}; do
  if curl -s "$UI_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

./scripts/seed-demo.sh || true

npm --prefix web install
npx --prefix web playwright install chromium

UI_URL="$UI_URL" node scripts/capture-screenshots.mjs

echo "Screenshots captured in docs/screenshots"
