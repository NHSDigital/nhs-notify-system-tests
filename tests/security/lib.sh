#!/bin/bash
set -euo pipefail

rnd() {
  local range="$1"; local len="$2"
  head /dev/urandom | LC_ALL=C tr -dc $range | head -c $len
}

password() {
  local upper=$(rnd 'A-Z' 3)
  local lower=$(rnd 'a-z' 3)
  local num=$(rnd '0-9' 3)
  local special=$(rnd '^$*.[]{}()?"!@#%&/\,><:;|_~+=' 3)

  echo "$upper$lower$num$special"
}

assertAccount() {
  local expected="975050048865"
  local acct=$(aws sts get-caller-identity | jq -r .Account) || acct="none"

  if [ "$acct" != "$expected" ]; then
      echo "you must be authenticated in the NHS Notify IAM Dev account to use this script" >&2
      return 1
  fi
}

getUserPoolId() {
  local environment="$1"

  local pools=$(aws cognito-idp list-user-pools --max-results 60) || pools="{}"

  if [ "$(echo $pools | jq .NextToken)" != "null" ]; then
    echo "more than 60 user pools exist. Pagination is required" >&2
    return 1
  fi

  local poolId=$(
    echo $pools | jq -r --arg env $environment \
      '.UserPools[] | select(.Name == "nhs-notify-" + $env + "-app") | .Id'
  )

  if [ -z "$poolId" ]; then
    echo "user pool for environment $environment not found" >&2
    return 1
  fi

  echo $poolId
}

createUser() {
  local userPoolId="$1"; local email="$2"; local tempPassword="$3"

  local user=$(
    aws cognito-idp admin-create-user \
      --user-pool-id $userPoolId \
      --username $email \
      --temporary-password $tempPassword \
      --user-attributes Name=email,Value=$email Name=email_verified,Value=True \
      --message-action SUPPRESS
    )

  if [ -z "$user" ]; then
    echo "failed to create user" >&2
    return 1
  fi

  echo $user | jq -r .User.Username
}

deleteUser() {
  local userPoolId="$1"; local userId="$2"

  aws cognito-idp admin-disable-user --user-pool-id $userPoolId --username $userId
  aws cognito-idp admin-delete-user --user-pool-id $userPoolId --username $userId
}

cleanupPreviouslyCreatedUsers() {
  local userPoolId="$1"; local prefix="$2"

  local users=$(
    aws cognito-idp list-users \
      --user-pool-id $userPoolId \
      --filter "email ^= \"$prefix\"" \
    | jq -r .Users
  )

  if [ -z "$users" ]; then
    echo "failed to list users" >&2
    return 1
  fi

  for user in $(echo $users | jq -c '.[]'); do
    local userCreateDate=$(echo $user | jq -r .UserCreateDate)
    local twoHoursAgo=$(date -v -2H -u +"%Y-%m-%dT%H:%M:%S")

    if [ -z "$userCreateDate" ] || [[ "$userCreateDate" < "$twoHoursAgo"  ]]; then
        local userId=$(echo $user | jq -r .Username)
        echo "deleting pre-existing test user $userId"
        deleteUser $userPoolId $userId
    fi
  done
}
