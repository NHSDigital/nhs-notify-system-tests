#!/bin/bash

set -euo pipefail

script_path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TARGET_ENVIRONMENT=$1

echo "Running the product test templates setup script..."
echo "Target Environment: $TARGET_ENVIRONMENT"

increase_sftp_polling_frequency() {
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
}

seed_client_configuration() {
  static_auth_data_path="${script_path}/../../fixtures/clients.json"
  ssm_client_prefix="/nhs-notify-${TARGET_ENVIRONMENT}-app/clients"

  jq -c '.clients | to_entries[].value' "$static_auth_data_path" \
  | while IFS= read -r client_json; do

    client_id=$(jq -r '.id' <<<"$client_json")
    campaign_ids=$(jq -r '.campaignIds' <<<"$client_json")
    features_json=$(jq -c '.features' <<<"$client_json")

    param_path="${ssm_client_prefix}/${client_id}"

    value=$(jq -n \
      --argjson c_ids "$campaign_ids" \
      --argjson feat "$features_json" \
      '{ campaignIds: $c_ids, features: $feat }'
    )

    aws ssm put-parameter \
      --name "$param_path" \
      --value "$value" \
      --type String \
      --overwrite

    echo "Created client SSM param: $param_path"
  done
}

increase_sftp_polling_frequency
seed_client_configuration
