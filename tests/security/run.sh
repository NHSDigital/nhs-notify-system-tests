#!/bin/bash
set -euo pipefail
cd $(dirname $BASH_SOURCE[0])
source lib.sh

environment="${TARGET_ENVIRONMENT:-main}"
email_prefix="security-test-login"
client_id=$(jq -r '.clients.Client4.id' ./fixtures/clients.json)
client_name=$(jq -r '.clients.Client4.name' ./fixtures/clients.json)
pw=$(password)

user_id=$(
  npx ts-node -T ./helpers/helper-cli/create-user.ts \
    --environment "$environment" \
    --email-prefix "$email_prefix" \
    --password "$pw" \
    --client-id "$client_id" \
    --client-name "$client_name"
)

print "Username (user id): $user_id"

delete_user() {
  npx ts-node -T ./helpers/helper-cli/delete-user.ts \
    --environment "$environment" \
    --username "$user_id" \
    --client-id "$client_id"
}

trap 'delete_user' SIGINT SIGTERM EXIT

print "Fetching cookie"

cookie=$(
  npx ts-node -T ./helpers/helper-cli/zap-spider-setup.ts \
    --web-gateway-environment $environment \
    --email-address "${email_prefix}@nhs.net" \
    --password $pw
)

cleanup() {
  print "Cleanup - deleting templates"

  npx ts-node -T ./helpers/helper-cli/zap-spider-teardown.ts \
    --web-gateway-environment $environment \
    --email-address "${email_prefix}@nhs.net" \
    --password $pw \
  || true

  delete_user
}

trap cleanup SIGINT SIGTERM EXIT

print "Got cookie"

base="https://${environment}.web-gateway.dev.nhsnotify.national.nhs.uk"
start_url="${base}/templates/message-templates"

image="ghcr.io/zaproxy/zaproxy:stable"
container_volume="$(pwd):/zap/wrk/:rw"
zap_config="/zap/wrk/zap-config.prop"
rules_config="/zap/wrk/rules.conf"

# https://www.zaproxy.org/docs/docker/baseline-scan/
docker pull "$image"

set +e

print "Scan 1 - starting ZAP scan at $start_url - without login"

docker run \
  --user root \
  --volume $container_volume \
  --network="host" \
  --tty "$image" zap-baseline.py \
    -z "-configfile $zap_config" \
    -t $start_url \
    -r zap-out-no-auth.html \
    -c $rules_config \
    -j \
    -d

no_login_exit="$?"

print "Scan 2 - starting ZAP scan at $start_url - with login"

docker run \
  --user root \
  --volume $container_volume \
  --env ZAP_AUTH_HEADER=Cookie \
  --env ZAP_AUTH_HEADER_VALUE="$cookie" \
  --network="host" \
  --tty "$image" zap-baseline.py \
    -z "-configfile $zap_config" \
    -t $start_url \
    -r zap-out-auth.html \
    -c $rules_config \
    -j \
    -d

with_login_exit=$?

print "Scan 3 - starting ZAP scan at $start_url - via Playwright security tests"

source run_playwright_via_zap.sh
run_playwright_via_zap "$environment"

system_test_exit=$?

if [[ $no_login_exit -ne 0 || $with_login_exit -ne 0 || $system_test_exit -ne 0 ]]; then
  print_err "Security scan failed"
  print_err "Scan 1 (without login) exit code: $no_login_exit"
  print_err "Scan 2 (with login) exit code: $with_login_exit"
  print_err "Scan 3 (proxying system tests) exit code: $system_test_exit"
  exit 1
fi
