# NHS Notify Template Management (WebUI) Security Tests

Tests consist of:

1. ZAP Spider test without login
2. ZAP spider test with login
3. Playwright user-journey tests proxied through ZAP

## Running the tests

Make sure the .env variable TARGET_ENVIRONMENT is correctly setup and sourced.  See .env.template for example.

Ensure that AWS_PROFILE_templates and AWS_PROFILE_auth are setup and sourced. The values should match the profile
names you have in your ~/.aws/config for the corresponding dev accounts for templates and auth/iam.

Tests run locally with the help of a script (local-lifecycle.sh) which emulates the matrix of CI jobs which run
setup, test and teardown phases in different accounts when running remotely.

Login with any AWS profile. The test-runner script will select the required profile.

```shell
export AWS_PROFILE=iam-dev
aws sso login
```

From the tests/security folder, run the following command:

```shell
npm run test:security:local
```

Extra arguments can be passed along to the test script (security/run.sh)

```shell
npm run test:security:local -- main 3"
```

The first positional argument is the name of the environment in the IAM dev account which contains the user pool
connected to the selected primary target environment. The second positional argument allows running only
a single test type (e.g. playwright proxy tests) and skipping others

The Playwright test result server does not run on failure, because this interferes with the test-runner script.
You can run it on demand with

```shell
npx playwright show-report
```
