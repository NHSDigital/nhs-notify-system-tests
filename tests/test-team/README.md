# NHS Notify Template Management (WebUI) Automated Regression Tests

This package includes tests for the template management UI and CIS2 login.
These tests are intended to run against deployed environments, and so no option to run locally has been included.

This package includes:

- e2e tests, which simulate a user going through the whole app.
- CIS2 login tests.

## Running the tests

Make sure the .env variable TARGET_ENVIRONMENT is correctly setup and sourced.  See .env.template for example.

Login with AWS profile for iam-dev so that CIS2 test can connect to retrieve secrets.

```shell
export AWS_PROFILE=iam-dev
aws sso login
```

From the root folder, run the following command:

```shell
make test-product
```

Or from the tests/test-team folder, run the following command:

```shell
npm run test:product
```
