run_playwright_via_zap() {
  print "Generating config with ignore rules"
  config_file="full-zap-config.prop"

  # start with baseline test config
  cp "zap-config.prop" $config_file

  # make api accessible from runner
  printf "api.disablekey=true\napi.addrs.addr.name=.*\napi.addrs.addr.regex=true" >> $config_file

  # add baseline test ignore rules to config
  # rules="rules.conf"
  # rule_index=0
  # while IFS= read -r line
  # do
  #   if [[ "$line" != \#* ]]; then
  #     rule_array=($line)

  #     printf "\n\nglobalalertfilter.filters.filter($rule_index).ruleid=${rule_array[0]}" >> $config_file
  #     # set level to false positive
  #     printf "\nglobalalertfilter.filters.filter($rule_index).newrisk=-1" >> $config_file

  #     # set url for out of scope rules
  #     if [[ ${rule_array[1]} == "OUTOFSCOPE" ]]; then
  #       printf "\nglobalalertfilter.filters.filter($rule_index).url=${rule_array[2]}" >> $config_file
  #       printf "\nglobalalertfilter.filters.filter($rule_index).urlregex=true" >> $config_file
  #     fi

  #     printf "\nglobalalertfilter.filters.filter($rule_index).enabled=true" >> $config_file
  #     ((rule_index++))
  #   fi
  # done < "$rules"

  zap_wait=10
  print "Starting ZAP headless and waiting $zap_wait seconds for proxy"
  docker run -v "$(pwd):/zap/wrk/:rw" -u zap -p 8888:8888 -i ghcr.io/zaproxy/zaproxy:stable zap.sh -daemon -host 0.0.0.0 -port 8888 -configfile /zap/wrk/$config_file &
  sleep $zap_wait

  zap_proxy="http://127.0.0.1:8888"
  export PLAYWRIGHT_ZAP_PROXY=$zap_proxy

  cd "$(git rev-parse --show-toplevel)"

  print "Installing Playwright"

  npx playwright install --with-deps > /dev/null

  cd tests/test-team

  print "Running product tests via ZAP proxy"

  npm run test:product

  print "Downloading ZAP report"
  curl $zap_proxy/OTHER/core/other/htmlreport/ > ../security/zap-out-product-tests.html

  print "Checking ZAP alert counts"
  alerts="$(curl $zap_proxy/JSON/alert/view/alertCountsByRisk/)"
  print "Alert counts: $alerts"

  print "Shutting down ZAP proxy and waiting $zap_wait seconds"
  curl $zap_proxy/JSON/core/action/shutdown/
  echo
  sleep $zap_wait

  # Check alert count output included High/Medium/Low all at 0
  if [ -z "$(echo "$alerts" | jq 'if (.High == 0 and .Medium == 0 and .Low == 0) then true else empty end')" ]; then
    print_err "Non-informational alerts occurred or unexpected result from alert count"
    exit 1
  fi
}
