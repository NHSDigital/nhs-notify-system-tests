#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT=$1

echo "Running the product test templates teardown script..."
echo "Target Environment: $TARGET_ENVIRONMENT"

sftp_poll_rule_name="nhs-notify-$TARGET_ENVIRONMENT-app-api-sftp-poll-wtmmock"

sftp_poll_rule_initial_rate=$(cat $script_path/setup.json | jq -r .initialState.rules.[\"$sftp_poll_rule_name\"].ScheduleExpression)

aws events put-rule --name $sftp_poll_rule_name --schedule-expression "$sftp_poll_rule_initial_rate"

