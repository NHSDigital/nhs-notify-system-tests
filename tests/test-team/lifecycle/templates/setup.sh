#!/bin/bash

set -euo pipefail

TARGET_ENVIRONMENT=$1

echo "Running the product test templates setup script..."
echo "Target Environment: $TARGET_ENVIRONMENT"

sftp_poll_rule_name="nhs-notify-$TARGET_ENVIRONMENT-app-api-sftp-poll-wtmmock"

aws events put-rule --name $sftp_poll_rule_name --schedule-expression "rate(1 minute)"

