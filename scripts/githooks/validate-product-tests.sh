#!/bin/bash

set -euo pipefail


# Ensure dependencies installed (fast-glob, tsx). Skip npm install for speed; assume user ran `make config`.

echo "[validate-product-tests] Running product test standards validator"

# Only run if spec files exist
SPEC_FILES=$(git ls-files 'tests/test-team/**/*.spec.ts' || true)
if [ -z "$SPEC_FILES" ]; then
  echo "[validate-product-tests] No product spec files detected; skipping"
  exit 0
fi

npx --no-install tsx scripts/validate-product-tests.ts > /tmp/validate-product-tests.json || VALIDATOR_EXIT=$?
VALIDATOR_EXIT=${VALIDATOR_EXIT:-0}

if [ $VALIDATOR_EXIT -ne 0 ]; then
  echo "[validate-product-tests] ❌ Violations detected"
  cat /tmp/validate-product-tests.json || true
  exit 1
fi

echo "[validate-product-tests] ✅ All product specs passed"
exit 0
