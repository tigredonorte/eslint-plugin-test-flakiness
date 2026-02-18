#!/bin/bash
# Lint only changed JS files (excludes unchanged files for speed)
#
# Usage:
#   pnpm dev:lint          # Lint changes in HEAD only (staged + unstaged)
#   pnpm dev:lint --main   # Lint all changes since origin/main

set -e

# Parse arguments
COMPARE_TO_MAIN=false
for arg in "$@"; do
  case $arg in
    --main)
      COMPARE_TO_MAIN=true
      shift
      ;;
  esac
done

# Get changed JS files
if [ "$COMPARE_TO_MAIN" = true ]; then
  CHANGED_FILES=$(git diff --name-only --diff-filter=d origin/main...HEAD | grep -E '\.js$' || true)
  echo "Linting changes against origin/main..."
else
  CHANGED_FILES=$(git diff --name-only --diff-filter=d HEAD | grep -E '\.js$' || true)
  STAGED_FILES=$(git diff --name-only --diff-filter=d --cached | grep -E '\.js$' || true)
  CHANGED_FILES=$(echo -e "$CHANGED_FILES\n$STAGED_FILES" | sort -u | grep -v '^$' || true)
  echo "Linting HEAD changes only (use --main for full branch comparison)..."
fi

if [ -z "$CHANGED_FILES" ]; then
  if [ "$COMPARE_TO_MAIN" = true ]; then
    echo "No JS files changed"
    exit 0
  else
    echo "No HEAD changes, falling back to origin/main comparison..."
    CHANGED_FILES=$(git diff --name-only --diff-filter=d origin/main...HEAD | grep -E '\.js$' || true)
    if [ -z "$CHANGED_FILES" ]; then
      echo "No JS files changed"
      exit 0
    fi
  fi
fi

echo "Files to lint:"
echo "$CHANGED_FILES" | sed 's/^/  /'
echo ""

# shellcheck disable=SC2086
npx eslint $CHANGED_FILES

echo "✅ Lint passed"
