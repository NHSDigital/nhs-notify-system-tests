#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT=$1
run_id=$2

echo "Running the product test templates teardown script..."
echo "Target Environment: $TARGET_ENVIRONMENT"
echo "Run ID: $run_id"

npm run test:product:teardown:templates -- ${TARGET_ENVIRONMENT} ${run_id}
