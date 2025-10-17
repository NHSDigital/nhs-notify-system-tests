#!/usr/bin/env bash

set -eu

pkg_dir="$1"
test_cmd="$2"
primary_test_profile_key="$3"
shift 3
extra_args=("$@")

target_environment="$TARGET_ENVIRONMENT"

exit_code=0

run_id="local$(date +%Y%m%d%H%M%S)"
echo -e "Running $test_cmd with target environment $target_environment and run ID $run_id\n"

run_lifecycle_phase() {
  local phase="$1"
  local lifecycle_dir="${pkg_dir}/lifecycle"
  for d in "${lifecycle_dir}"/*/; do
    [ -d "$d" ] || continue
    if [[ "$phase" == "setup" ]]; then rm -f "${d}state.json"; fi

    acct_key=$(basename "$d")
    profile_var="AWS_PROFILE_${acct_key}"

    if [[ -z "${!profile_var:-}" ]]; then
      echo "Error: \$${profile_var} is not set" >&2
      exit 1
    fi

    export AWS_PROFILE="${!profile_var}"
    echo -e "\033[0;36m→ ${phase} [${acct_key}] AWS_PROFILE=${AWS_PROFILE}\033[0m"

    script="${lifecycle_dir}/${acct_key}/${phase}.sh"

    if [[ ! -f "$script" ]]; then
      echo "→ no ${phase}.sh script for ${acct_key}, skipping"
      continue
    fi

    if ! bash "$script" "$target_environment" "$run_id"; then
      echo "✖ ${phase} lifecycle failed for ${acct_key}" >&2
      exit_code=1
      [[ $phase = setup ]] && return
    fi
    echo
  done
}

run_lifecycle_phase setup

if [[ "$exit_code" -eq 0 ]]; then
  primary_profile_var="AWS_PROFILE_${primary_test_profile_key}"

  if [[ -z "${!primary_profile_var:-}" ]]; then
    echo "Error: \$${primary_profile_var} is not set" >&2
    exit 1
  fi

  export AWS_PROFILE="${!primary_profile_var}"
  echo -e "→ running npm run ${test_cmd} in ${pkg_dir} AWS_PROFILE=${AWS_PROFILE}\n"

  pushd "$pkg_dir" >/dev/null

  export RUN_ID="$run_id"

  if ! npm run "$test_cmd" -- ${extra_args+"${extra_args[@]}"}; then
    echo -e "✖ ${test_cmd} failed\n" >&2
    exit_code=1
  fi

  popd >/dev/null
else
  echo "→ setup lifecycle failed, skipping tests"
fi

run_lifecycle_phase teardown

exit "$exit_code"
