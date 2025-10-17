# NHS Notify Template Management (WebUI) Automated Regression Tests

This package includes tests for the template management UI and CIS2 login.
These tests are intended to run against deployed environments, and so no option to run locally has been included.

This package includes:

- e2e tests, which simulate a user going through the whole app.
- CIS2 login tests.

## Running the tests

Make sure the .env variable TARGET_ENVIRONMENT is correctly setup and sourced.  See .env.template for example.

Ensure that AWS_PROFILE_templates and AWS_PROFILE_auth are setup and sourced. The values should match the profile
names you have in your ~/.aws/config for the corresponding dev accounts for templates and auth/iam.

Tests are run locally using a script which emulates the matrix of CI jobs which run setup, test and teardown phases 
in different accounts.

Login with any AWS profile. The test-runner script will select the required profile.

```shell
export AWS_PROFILE=iam-dev
aws sso login
```

From the tests/test-team folder, run the following command:

```shell
npm run test:product:local
```

Extra arguments can be passed to playwright. e.g:

```shell
npm run test:product:local -- --grep "just this test"
```

The Playwright test result server does not run on failure, because this interferes with the test-runner script.
You can run it on demand with

```shell
npx playwright show-report
```