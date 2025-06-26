#!/bin/bash

set -euo pipefail

TARGET_ENVIRONMENT=$1

echo "Hello from the product test templates setup script."
echo "Target Environment $TARGET_ENVIRONMENT"

aws sts get-caller-identity
