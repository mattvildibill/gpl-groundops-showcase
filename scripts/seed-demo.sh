#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PLANNER_URL:-http://localhost:8080}"
TOKEN="$(./scripts/generate-token.sh PLANNER demo-planner)"

read -r start1 end1 start2 end2 < <(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
now = datetime.now(tz=timezone.utc)
start1 = now + timedelta(hours=1)
end1 = now + timedelta(hours=3)
start2 = now + timedelta(hours=2)
end2 = now + timedelta(hours=4)
print(start1.strftime('%Y-%m-%dT%H:%M:%SZ'), end1.strftime('%Y-%m-%dT%H:%M:%SZ'),
      start2.strftime('%Y-%m-%dT%H:%M:%SZ'), end2.strftime('%Y-%m-%dT%H:%M:%SZ'))
PY
)

create_plan() {
  local response
  local status
  response=$(curl -sS -w "\n%{http_code}" -X POST "$BASE_URL/api/plans" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$1")
  status=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')

  if [[ "$status" != "200" && "$status" != "201" ]]; then
    echo "Failed to create plan (HTTP $status):"
    echo "$body"
    exit 1
  fi

  echo "$body"
}

plan1=$(create_plan "{\"asset\":\"AURORA-7\",\"startTime\":\"$start1\",\"endTime\":\"$end1\",\"priority\":\"PRIORITY\",\"notes\":\"Routine imaging pass for coastal survey.\"}")
plan2=$(create_plan "{\"asset\":\"ARGO-2\",\"startTime\":\"$start2\",\"endTime\":\"$end2\",\"priority\":\"CRITICAL\",\"notes\":\"Urgent thermal scan following anomaly detection in grid 12.\"}")

plan1_id=$(echo "$plan1" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
plan2_id=$(echo "$plan2" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

curl -sS -X POST "$BASE_URL/api/plans/$plan2_id/approve" \
  -H "Authorization: Bearer $TOKEN" >/dev/null

printf "Seeded plans: %s (draft), %s (approved)\n" "$plan1_id" "$plan2_id"
