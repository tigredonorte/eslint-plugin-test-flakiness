#!/usr/bin/env bash
# Wait for a new Copilot review on a GitHub PR.
# Usage: ./scripts/wait-copilot-review.sh <owner/repo> <pr-number> [timeout_seconds]
#
# Polls every 30s and exits as soon as a new review appears.
# Default timeout: 300s (5 minutes). Exits with code 1 on timeout.

set -euo pipefail

REPO="${1:?Usage: $0 <owner/repo> <pr-number> [timeout_seconds]}"
PR="${2:?Usage: $0 <owner/repo> <pr-number> [timeout_seconds]}"
TIMEOUT="${3:-300}"
INTERVAL=30

BASELINE=$(gh api "repos/$REPO/pulls/$PR/reviews" --jq 'length' 2>/dev/null)
echo "Baseline: $BASELINE reviews. Polling every ${INTERVAL}s (timeout: ${TIMEOUT}s)..."

ELAPSED=0
while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
  COUNT=$(gh api "repos/$REPO/pulls/$PR/reviews" --jq 'length' 2>/dev/null)
  echo "[${ELAPSED}s] $COUNT reviews (baseline: $BASELINE)"
  if [ "$COUNT" -gt "$BASELINE" ]; then
    echo "New review detected!"
    # Print the latest review summary
    gh api "repos/$REPO/pulls/$PR/reviews" \
      --jq '.[-1] | "State: \(.state) | By: \(.user.login) | At: \(.submitted_at)"' 2>/dev/null
    exit 0
  fi
done

echo "Timeout after ${TIMEOUT}s — no new review arrived."
exit 1
