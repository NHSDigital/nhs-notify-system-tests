#!/bin/bash
set -euo pipefail
cd $(dirname $BASH_SOURCE[0])
source lib.sh

webGatewayEnvironment="${1:-main}"
iamEnvironment="${2:-main}"
templateManagementBranch="${3:-}"

assertAccount

emailPrefix="security-test-login"
email="${emailPrefix}-$(rnd 'a-zA-Z0-9' 8)@nhs.net"
tempPassword=$(password)
finalPassword=$(password)

echo "test user email: $email"

userPool=$(getUserPoolId $iamEnvironment)
echo "userPoolId: $userPool"

cleanupPreviouslyCreatedUsers $userPool $emailPrefix

userId=$(createUser $userPool $email $tempPassword)
echo "username: $userId"

cleanup() {
  echo "cleanup - deleting user: $userId"
  deleteUser $userPool $userId || true
}

trap cleanup EXIT

echo "fetching cookie"

cookie=$(
  npm run fetch-cookie \
    --silent -- \
      --environment $webGatewayEnvironment \
      --email-address $email \
      --temp-password $tempPassword \
      --final-password $finalPassword
)

echo "fetched cookie"

if [ -n "$templateManagementBranch" ]; then
  templateManagementBranch="~$templateManagementBranch"
fi

base="https://${webGatewayEnvironment}.web-gateway.dev.nhsnotify.national.nhs.uk"
startUrl="${base}/templates${templateManagementBranch}/create-and-submit-templates"

echo "starting ZAP scan at $startUrl"

chmod a+w $(pwd)

docker pull "ghcr.io/zaproxy/zaproxy:stable"

docker run \
  -v $(pwd):/zap/wrk/:rw \
  -e ZAP_AUTH_HEADER=Cookie -e ZAP_AUTH_HEADER_VALUE="$cookie" \
  --network="host" \
  -t "ghcr.io/zaproxy/zaproxy:stable" zap-baseline.py \
    -z "-configfile /zap/wrk/add-user-agent-config.txt" \
    -t $startUrl \
    -r zap-out.html \
    -d
