#!/bin/bash
set -euo pipefail
cd $(dirname $BASH_SOURCE[0])
source lib.sh

web_gateway_environment="${1:-main}"
iam_environment="${2:-main}"
template_management_branch="${3:-}"

assert_account

email_prefix="security-test-login"
email="${email_prefix}-$(rnd 'a-zA-Z0-9' 8)@nhs.net"
temp_password=$(password)
final_password=$(password)

print "Test user email: $email"

user_pool=$(get_user_pool_id $iam_environment)
print "User pool id: $user_pool"

cleanup_previously_created_users $user_pool $email_prefix

user_id=$(create_user $user_pool $email $temp_password)
print "Username (user id): $user_id"

cleanup() {
  print "Cleanup - deleting user: $user_id"
  delete_user $user_pool $user_id || true
}

trap cleanup EXIT

print "Fetching cookie"

branch_segment=$(get_branch_segment "$template_management_branch")

cookie=$(
  npx ts-node ./src/fetch-cookie.ts \
    --web-gateway-environment $web_gateway_environment \
    --branch-segment $branch_segment \
    --email-address $email \
    --temp-password $temp_password \
    --final-password $final_password
)

print "Got cookie"

base="https://${web_gateway_environment}.web-gateway.dev.nhsnotify.national.nhs.uk"
start_url="${base}/templates${branch_segment}/create-and-submit-templates"

image="ghcr.io/zaproxy/zaproxy:stable"
container_volume="$(pwd):/zap/wrk/:rw"
zap_config="/zap/wrk/zap-config.prop"
rules_config="/zap/wrk/rules.conf"
progress_config="/zap/wrk/progress.json"

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
    -r report/zap-out-no-auth.html \
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
    -r report/zap-out-auth.html \
    -c $rules_config \
    -j \
    -d

with_login_exit=$?

if [[ $no_login_exit -ne 0 || $with_login_exit -ne 0 ]]; then
  print_err "Security scan failed"
  print_err "Scan 1 (without login) exit code: $no_login_exit"
  print_err "Scan 2 (with login) exit code: $with_login_exit"
  exit 1
fi
