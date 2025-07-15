wait_for_zap() {
  local zap_proxy_url="$1"
  local zap_poll_max_retries=60
  local zap_poll_sleep_seconds=2

  if [[ -z "$zap_proxy_url" ]]; then
    echo "Error: No ZAP proxy URL provided."
    echo "Usage: wait_for_zap http://127.0.0.1:8888"
    return 1
  fi

  local version_endpoint="${zap_proxy_url%/}/JSON/core/view/version/"


  echo "Waiting for ZAP proxy to be ready at $version_endpoint..."

  for ((i=1; i<=zap_poll_max_retries; i++)); do
      # Try to curl the version endpoint
      local zap_response
      zap_response=$(curl --silent --fail "$version_endpoint")

      if [[ $? -eq 0 ]]; then
      local zap_version
      zap_version=$(echo "$zap_response" | jq -r .version)
      echo "ZAP is up (version: $zap_version)"
      return 0
    else
      echo "[$i/$zap_poll_max_retries] ZAP not ready yet, retrying in $zap_poll_sleep_seconds seconds..."
      sleep "$zap_poll_sleep_seconds"
    fi
  done

  echo "Timed out waiting for ZAP after $((zap_poll_max_retries * zap_poll_sleep_seconds)) seconds."
  return 1
}

cleanup_zap() {
  local zap_url="$1"
  local container_id="$2"

  if [[ -z "$zap_url" || -z "$container_id" ]]; then
    echo "cleanup_zap: ZAP URL and container ID are required."
    return 1
  fi

  echo "Cleaning up ZAP (url: $zap_url, container: $container_id)..."

  curl --silent --fail --output /dev/null "$zap_url/JSON/core/action/shutdown/" \
    || echo "Shutdown via API failed"

  docker stop "$container_id" > /dev/null || {
    echo "Docker stop failed"
    return 1
  }

  docker rm "$container_id" > /dev/null || echo "Docker r failed"
}


run_playwright_via_zap() {
  print "Generating config with ignore rules"
  config_file="full-zap-config.prop"

  # start with baseline test config
  cp "zap-config.prop" $config_file

  # make api accessible from runner
  printf "api.disablekey=true\napi.addrs.addr.name=.*\napi.addrs.addr.regex=true" >> $config_file

  # add baseline test ignore rules to config
  rules="rules.conf"
  rule_index=0
  while IFS= read -r line
  do
    if [[ "$line" != \#* ]]; then
      rule_array=($line)

      printf "\n\nglobalalertfilter.filters.filter($rule_index).ruleid=${rule_array[0]}" >> $config_file
      # set level to false positive
      printf "\nglobalalertfilter.filters.filter($rule_index).newrisk=-1" >> $config_file

      # set url for out of scope rules
      if [[ ${rule_array[1]} == "OUTOFSCOPE" ]]; then
        printf "\nglobalalertfilter.filters.filter($rule_index).url=${rule_array[2]}" >> $config_file
        printf "\nglobalalertfilter.filters.filter($rule_index).urlregex=true" >> $config_file
      fi

      printf "\nglobalalertfilter.filters.filter($rule_index).enabled=true" >> $config_file
      ((rule_index++))
    fi
  done < "$rules"

  print "Starting ZAP"
  zap_proxy_url="http://127.0.0.1:8888"
  zap_container_id=$(docker run -d -v "$(pwd):/zap/wrk/:rw" -u zap -p 8888:8888 -i ghcr.io/zaproxy/zaproxy:stable zap.sh -daemon -host 0.0.0.0 -port 8888 -configfile /zap/wrk/$config_file)

  if [[ -z "$zap_container_id" ]]; then
    echo "Failed to start ZAP container."
    return 1
  fi

  # also register 'cleanup' from run.sh
  trap "cleanup_zap '$zap_proxy_url' '$zap_container_id'; cleanup" SIGINT SIGTERM EXIT

  wait_for_zap $zap_proxy_url || {
    echo "ZAP health check failed."
    exit 1
  }

  export PLAYWRIGHT_ZAP_PROXY=$zap_proxy_url
  export CI=true

  cd "$(git rev-parse --show-toplevel)"

  print "Installing Playwright"

  npx playwright install --with-deps > /dev/null

  cd tests/security

  print "Running security playwright tests via ZAP proxy"

  npm run test:security:playwright

  playwright_status_code=$?

  print "Downloading ZAP report"
  curl --silent $zap_proxy_url/OTHER/core/other/htmlreport/ > ../security/zap-out-product-tests.html

  print "Checking ZAP alert counts"
  alerts="$(curl --silent $zap_proxy_url/JSON/alert/view/alertCountsByRisk/)"
  print "Alert counts: $alerts"

  if [ $playwright_status_code -ne 0 ]; then
    print_err "Playwright tests failed"
    return 1
  fi

  # Check alert count output included High/Medium/Low all at 0
  if [ -z "$(echo "$alerts" | jq 'if (.High == 0 and .Medium == 0 and .Low == 0) then true else empty end')" ]; then
    print_err "Non-informational alerts occurred or unexpected result from alert count"
    return 1
  fi
}
