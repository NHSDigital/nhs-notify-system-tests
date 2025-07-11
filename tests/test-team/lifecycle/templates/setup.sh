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

static_auth_data_path="$script_path/../config/static-auth-data.json"
ssm_client_prefix="/nhs-notify-${TARGET_ENVIRONMENT}-app/clients"

jq -r '
  .clients
  | to_entries[]
  | [ .value.id, .value.campaignId, (.value.features | @json) ]
  | @tsv' "$static_auth_data_path" | while IFS=$'\t' read -r client_id campaign_id features_json; do

  param_path="${ssm_client_prefix}/${client_id}"

  value=$(jq -n \
    --arg c_id "$campaign_id" --argjson feat "$features_json" \
    '{ campaignId: $c_id, features: $feat }'
  )

  aws ssm put-parameter --name "$param_path" --value "$value" --type String --overwrite

  echo "Created client SSM param: $param_path"
done
