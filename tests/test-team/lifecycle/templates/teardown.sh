#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT=$1

echo "Running the product test templates teardown script..."
echo "Target Environment: $TARGET_ENVIRONMENT"

sftp_poll_rule_name="nhs-notify-$TARGET_ENVIRONMENT-app-api-sftp-poll-wtmmock"

sftp_poll_rule_initial_rate=$(cat $script_path/setup.json | jq -r .initialState.rules.[\"$sftp_poll_rule_name\"].ScheduleExpression)

aws events put-rule --name $sftp_poll_rule_name --schedule-expression "$sftp_poll_rule_initial_rate"

static_auth_data_path="$script_path/../config/static-auth-data.json"
ssm_client_prefix="/nhs-notify-${TARGET_ENVIRONMENT}-app/clients"

jq -r '.clients | to_entries[] | .value.id' "$static_auth_data_path" | while IFS=$'\n' read -r client_id; do
  param_path="${ssm_client_prefix}/${client_id}"

  aws ssm delete-parameter --name "$param_path"

  echo "Deleted client SSM param: $param_path"
done
