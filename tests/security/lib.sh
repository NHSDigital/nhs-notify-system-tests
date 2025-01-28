#!/bin/bash
set -euo pipefail

print() {
  local text="$1"
  printf "\e[38;5;146m%s\e[0m\n" "$text"
}

print_err() {
  local text="$1"
  printf "\e[31m%s\e[0m\n" "$text" >&2
}

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

assert_account() {
  local expected="975050048865"
  local acct=$(aws sts get-caller-identity | jq -r .Account) || acct="none"

  if [ "$acct" != "$expected" ]; then
      print_err "You must be authenticated in the NHS Notify IAM Dev account to use this script"
      return 1
  fi
}

get_branch_segment() {
  local template_management_branch="$1"

  if [ -n "$template_management_branch" ]; then
    template_management_branch="~$(echo $template_management_branch | tr -d '/')"
  fi
}

get_user_pool_id() {
  local iam_environment="$1"

  local pools=$(aws cognito-idp list-user-pools --max-results 60) || pools="{}"

  if [ "$(echo $pools | jq .NextToken)" != "null" ]; then
    print_err "More than 60 user pools exist. Pagination is required"
    return 1
  fi

  local pool_id=$(
    echo $pools | jq -r --arg env $iam_environment \
      '.UserPools[] | select(.Name == "nhs-notify-" + $env + "-app") | .Id'
  )

  if [ -z "$pool_id" ]; then
    print_err "User pool for IAM environment $iam_environment not found"
    return 1
  fi

  echo $pool_id
}

create_user() {
  local user_pool_id="$1"; local email="$2"; local temp_password="$3"

  local user=$(
    aws cognito-idp admin-create-user \
      --user-pool-id $user_pool_id \
      --username $email \
      --temporary-password $temp_password \
      --user-attributes Name=email,Value=$email Name=email_verified,Value=True \
      --message-action SUPPRESS
    )

  if [ -z "$user" ]; then
    print_err "Failed to create user"
    return 1
  fi

  echo $user | jq -r .User.Username
}

delete_user() {
  local user_pool_id="$1"; local user_id="$2"

  aws cognito-idp admin-disable-user --user-pool-id $user_pool_id --username $user_id
  aws cognito-idp admin-delete-user --user-pool-id $user_pool_id --username $user_id
}

cleanup_previously_created_users() {
  local user_pool_id="$1"; local prefix="$2"

  local users=$(
    aws cognito-idp list-users \
      --user-pool-id $user_pool_id \
      --filter "email ^= \"$prefix\"" \
    | jq -r .Users
  )

  if [ -z "$users" ]; then
    print_err "Failed to list users"
    return 1
  fi

  for user in $(echo $users | jq -c '.[]'); do
    local user_create_date=$(echo $user | jq -r .UserCreateDate)
    local two_hours_ago=$(date -v -2H -u +"%Y-%m-%dT%H:%M:%S")

    if [ -z "$user_create_date" ] || [[ "$user_create_date" < "$two_hours_ago"  ]]; then
        local user_id=$(echo $user | jq -r .Username)
        print "Deleting pre-existing test user $user_id"
        delete_user $user_pool_id $user_id
    fi
  done
}
