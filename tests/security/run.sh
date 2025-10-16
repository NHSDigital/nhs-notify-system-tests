#!/bin/bash
set -euo pipefail
cd $(dirname $BASH_SOURCE[0])
source lib.sh

environment="${1:-main}"
iam_environment="${2:-${1:-main}}"
run_single_test="${3:-0}"

auth_setup_state_file="./lifecycle/auth/state.json"
email=$(jq -r '.users["zap-spider.security"].email' $auth_setup_state_file)
password=$(jq -r '.users["zap-spider.security"].password' $auth_setup_state_file)

base="https://${environment}.web-gateway.dev.nhsnotify.national.nhs.uk"
start_url="${base}/templates/message-templates"

no_login_exit=0
with_login_exit=0
system_test_exit=0

if [[ $run_single_test -eq 0 || $run_single_test -eq 1 || $run_single_test -eq 2 ]]; then
  print "Fetching cookie"

  cookie=$(
    npx ts-node -T ./helpers/helper-cli/zap-spider-setup.ts \
      --web-gateway-environment $environment \
      --email-address $email \
      --password $password
  )

  print "Got cookie"

  # https://www.zaproxy.org/docs/docker/baseline-scan/
  image="ghcr.io/zaproxy/zaproxy:stable"
  container_volume="$(pwd):/zap/wrk/:rw"
  zap_config="/zap/wrk/zap-config.prop"
  rules_config="/zap/wrk/rules.conf"

  set +e

  if [[ $run_single_test -eq 0 || $run_single_test -eq 1 ]]; then
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
  fi

  if [[ $run_single_test -eq 0 || $run_single_test -eq 2 ]]; then
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
  fi
fi

if [[ $run_single_test -eq 0 || $run_single_test -eq 3 ]]; then
  print "Scan 3 - starting ZAP scan at $start_url - via Playwright security tests"

  source run_playwright_via_zap.sh
  run_playwright_via_zap "$environment"

  system_test_exit=$?
fi


if [[ $no_login_exit -ne 0 || $with_login_exit -ne 0 || $system_test_exit -ne 0 ]]; then
  print_err "Security scan failed"
  print_err "Scan 1 (without login) exit code: $no_login_exit"
  print_err "Scan 2 (with login) exit code: $with_login_exit"
  print_err "Scan 3 (proxying system tests) exit code: $system_test_exit"
  exit 1
fi
