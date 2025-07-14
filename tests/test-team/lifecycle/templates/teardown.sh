#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT=$1

echo "Running the product test templates teardown script..."
echo "Target Environment: $TARGET_ENVIRONMENT"

restore_sftp_polling_frequency() {
  local sftp_poll_rule_name="nhs-notify-${TARGET_ENVIRONMENT}-app-api-sftp-poll-wtmmock"
  local setup_file="$script_path/setup.json"

  [[ -f "$setup_file" ]] || return 0

  local initial_rate
  initial_rate=$(jq -r --arg name "$sftp_poll_rule_name" \
    '.initialState.rules[$name].ScheduleExpression' \
    "$setup_file")

  aws events put-rule --name "$sftp_poll_rule_name" --schedule-expression "$initial_rate"
}


delete_client_configuration() {
  static_auth_data_path="$script_path/../../fixtures/clients.json"
  ssm_client_prefix="/nhs-notify-${TARGET_ENVIRONMENT}-app/clients"

  jq -r '.clients | to_entries[] | .value.id' "$static_auth_data_path" \
  | while IFS=$'\n' read -r client_id; do
    param_path="${ssm_client_prefix}/${client_id}"

    aws ssm delete-parameter --name "$param_path"

    echo "Deleted client SSM param: $param_path"
  done
}

restore_sftp_polling_frequency
delete_client_configuration
