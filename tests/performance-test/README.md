# Locust Performance Tests

## AWS account Login

Login to AWS account and export the profile in console where you want to execute the test

e.g. if you want to trigger a test in dev2 environment
`export AWS_PROFILE=comms-mgr-dev2`
and then use login command
`aws sso login`

## Run via locust

You may compose a locust command with poetry directly:

`poetry run locust -f runlocustplaywright.py`

This command should be run in tests/performance-test directory.
