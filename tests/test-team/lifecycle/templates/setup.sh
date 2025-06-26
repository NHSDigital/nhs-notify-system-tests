#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT=$1

echo "Running the product test templates setup script..."
echo "Target Environment: $TARGET_ENVIRONMENT"

sftp_poll_rule_name="nhs-notify-$TARGET_ENVIRONMENT-app-api-sftp-poll-wtmmock"

sftp_poll_rule=$(aws events describe-rule \
  --name $sftp_poll_rule_name \
  --output json)

echo "{
  \"initialState\": {
    \"rules\": {
      \"$sftp_poll_rule_name\": $sftp_poll_rule
    }
  }
}" > $script_path/setup.json

aws events put-rule --name $sftp_poll_rule_name --schedule-expression "rate(1 minute)"

