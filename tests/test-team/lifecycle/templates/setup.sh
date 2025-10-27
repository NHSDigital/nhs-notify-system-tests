#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT="$1"
run_id="$2"

echo "Running the product test templates setup script..."

npx tsx "${script_path}/setup.ts" "$TARGET_ENVIRONMENT" "$run_id"
