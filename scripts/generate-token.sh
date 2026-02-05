#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 ROLE [SUBJECT]" >&2
  exit 1
fi

ROLE="$1"
LOWER_ROLE=$(echo "$ROLE" | tr '[:upper:]' '[:lower:]')
SUBJECT="${2:-demo-${LOWER_ROLE}}"
SECRET="${JWT_SECRET:-local-dev-secret-32-bytes-minimum!}"
EXP_MINUTES="${EXP_MINUTES:-480}"

ROLE="$ROLE" SUBJECT="$SUBJECT" SECRET="$SECRET" EXP_MINUTES="$EXP_MINUTES" python3 - <<PY
import base64
import json
import hmac
import hashlib
import time
import os

role = os.environ.get("ROLE")
subject = os.environ.get("SUBJECT")
secret = os.environ.get("SECRET").encode()
exp_minutes = int(os.environ.get("EXP_MINUTES", "480"))

now = int(time.time())
header = {"alg": "HS256", "typ": "JWT"}
payload = {
    "iss": "groundops-local",
    "sub": subject,
    "roles": [role],
    "iat": now,
    "exp": now + exp_minutes * 60,
}

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

segments = [
    b64url(json.dumps(header, separators=(",", ":")).encode()),
    b64url(json.dumps(payload, separators=(",", ":")).encode()),
]
unsigned = ".".join(segments).encode()
signature = hmac.new(secret, unsigned, hashlib.sha256).digest()
segments.append(b64url(signature))
print(".".join(segments))
PY
