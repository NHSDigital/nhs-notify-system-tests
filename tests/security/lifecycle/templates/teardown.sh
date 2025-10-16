#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT="$1"
run_id="$2"

echo "Running the security test templates teardown script..."
echo "Target Environment: $TARGET_ENVIRONMENT"
echo "Run ID: $run_id"

npx tsx "${script_path}/teardown.ts" "$TARGET_ENVIRONMENT" "$run_id"
