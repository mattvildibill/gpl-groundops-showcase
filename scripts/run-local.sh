#!/usr/bin/env bash
set -euo pipefail

export JWT_SECRET="${JWT_SECRET:-local-dev-secret-32-bytes-minimum!}"

if docker compose version >/dev/null 2>&1; then
  docker compose -f infra/docker-compose.yml up --build
else
  docker-compose -f infra/docker-compose.yml up --build
fi
