zap_proxy_playwright() {
  cd "$(git rev-parse --show-toplevel)"

  print "Installing Playwright"

  npx playwright install --with-deps > /dev/null

  print "Installing ZAP"
  wget https://github.com/zaproxy/zaproxy/releases/download/v2.16.1/ZAP_2.16.1_Linux.tar.gz
  tar -xzf ZAP_2.16.1_Linux.tar.gz
  cd ZAP_2.16.1

  print "Generating config with ignore rules"
  config_file="full-zap-config.prop"

  # start with baseline test config
  cp "../tests/security/zap-config.prop" $config_file

  # disable auth on zap api
  printf "api.disablekey=true" >> $config_file

  # add baseline test ignore rules to config
  rules="../tests/security/rules.conf"
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

  zap_wait=10
  print "Initialising ZAP daemon and waiting $zap_wait seconds for proxy"
  ./zap.sh -daemon -host "127.0.0.1" -port 8888 -configfile $config_file &
  sleep $zap_wait

  cd ../tests/test-team

  export PLAYWRIGHT_ZAP_PROXY="http://127.0.0.1:8888"

  print "Running product tests via ZAP proxy"

  npm run test:product

  print "Downloading ZAP report"
  curl http://127.0.0.1:8888/OTHER/core/other/htmlreport/ > ../security/zap-out-product-tests.html

  print "Checking ZAP alert counts"
  alerts="$(curl http://127.0.0.1:8888/JSON/alert/view/alertCountsByRisk/)"
  print "Alert counts: $alerts"

  print "Shutting down ZAP proxy and waiting $zap_wait seconds"
  curl http://127.0.0.1:8888/JSON/core/action/shutdown/
  echo
  sleep $zap_wait

  # Check alert count output included High/Medium/Low all at 0
  if [ -z "$(echo "$alerts" | jq 'if (.High == 0 and .Medium == 0 and .Low == 0) then passed else empty end')" ]; then
    print_err "Non-informational alerts occurred or unexpected result from alert count"
    exit 1
  fi
}
