# AI Coding Agent Instructions for `nhs-notify-system-tests`

These guidelines make an AI agent immediately productive in this repo. They document existing, observable patterns only.

## Purpose & High-Level Structure
- This repository houses cross-product system and product-level tests for NHS Notify web template management. It is a consumer/test harness, not the application source.
- Key areas:
  - `scripts/` automation (Make targets, test runners, tooling bootstrap).
  - `tests/` contains multiple workspaces (`tests/test-team` for Playwright product/e2e tests; other folders for security, shared utilities, cleanup).
  - `.github/workflows/` orchestrates a staged pipeline (commit → test → build → acceptance → publish) plus scheduled product & security test runs.

## Development Workflow
- Use `make help` to discover available targets (targets are categorized via trailing `@Category`).
- Bootstrap local dev env & hooks: `make config` (installs `.tool-versions` dependencies via `asdf` and pre-commit hooks; builds docs assets).
- Create/update version metadata: `make version` (outputs `.version` + `version.json`).
- Run all implemented test suites: `make test` (composes granular `make test-*` targets). Many test scripts are placeholders until implemented.
- Product Playwright tests (UI/e2e):
  - Local fast path: `make test-product` (invokes `scripts/tests/product.sh`).
  - Script installs Playwright browsers (`npx playwright install --with-deps`) then executes `npm run test:product` in `tests/test-team`.
  - CI uses `product-tests.yaml` dispatch workflow; accepts `targetEnvironment` input.
- To run a single product test locally with correct env: set `TARGET_ENVIRONMENT` (defaults to `main` from `tests/.env`).

## Test Architecture & Patterns
- Page Object Model under `tests/test-team/pages/` (e.g. `template-mgmt-base-page.ts`, `template-mgmt-letter-page.ts`). Common patterns:
  - Locator composition using chained `.locator().and()` and role-based selectors for accessibility and stability.
  - Explicit retry loops for eventually-consistent backend operations (e.g. file processing in `TemplateMgmtLetterPage.uploadLetterTemplate()` and proof generation in `waitForProofRequest()`). Maintain these semantics when extending.
  - Environment-driven base URL: `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk` in `config/dev.config.ts`.
  - Optional dynamic proxy config when `PLAYWRIGHT_ZAP_PROXY` is set (security scanning integration) – preserve conditional blocks when modifying Playwright configs.
- Authentication helper in `fixtures/login.ts` performs CIS2 multi-factor login (username/password + TOTP with retry). When enhancing auth flows, keep TOTP retry + selectors stable.
- Long-running polling uses bounded retry counts + incremental `waitForTimeout`. If creating new polling, follow pattern: finite `maxRetries`, short `retryInterval`, explicit thrown error on exhaustion.

## Conventions
- Makefile target descriptions use trailing category `@Testing`, `@Development`, etc. Preserve format so `make help` parsing works.
- Shell scripts in `scripts/tests/` correspond 1:1 with `make test-*` targets (`_test` dispatcher checks for existence and prints a clear message if absent). Add new test types by creating a script and target pair.
- Use `set -euo pipefail` at top of new bash scripts (consistency & safety).
- Page objects: constructor sets primary locators; interaction methods are simple and await Playwright actions/assertions. Keep responsibilities focused (no test assertions beyond visibility/state checks inside helper methods).
- Prefer role-/data-testid-based selectors; avoid brittle CSS unless necessary.

## Extending Tests
- Create new test projects under `tests/<workspace>` and add to root `package.json` `workspaces` if shared dependencies are needed.
- Add new `make test-<name>` target + script; update `make test` aggregation only if it should run in CI with others.
- When introducing additional Playwright reporters or artifacts, align with existing HTML + JUnit approach in `playwright.config.ts`.
- For secrets-sensitive contexts (traces), note existing comment: disable traces (`trace: 'off'`) in configs that might leak credentials.

## CI/CD Integration
- Staged workflows call `make test-*` targets directly (see `stage-2-test.yaml`). Keep test invocation scripts minimal & idempotent.
- Product/security scheduled workflows dispatch internal composite workflows with `targetEnvironment` & `internalRef` inputs – reuse this pattern for new periodic test jobs.
- Static analysis implemented via local composite action `.github/actions/perform-static-analysis` (SonarCloud). If adding languages, update that action rather than pipeline steps.

## Environment & Credentials
- Env vars consumed: `TARGET_ENVIRONMENT`, `PLAYWRIGHT_ZAP_PROXY`. Document new ones in this file when added.
- TOTP & CIS2 credentials sourced through shared provider `getCis2Credentials()` from `nhs-notify-system-tests-shared`. Maintain abstraction; do not inline secrets.

## Safe Change Guidelines
- Avoid editing `scripts/init.mk` or `scripts/tests/test.mk` directly (template-managed). Extend via project Makefile or new scripts.
- Maintain retry/polling limits to prevent runaway CI times.
- Keep selectors resilient (prefer roles, text regex with whitespace handling like `/\W+Continue\W+/`).

## Quick Start (Agent)
1. Run `make config`.
2. Set `TARGET_ENVIRONMENT=main` (or desired) and run `make test-product`.
3. Add page object & test under `tests/test-team/` following existing patterns.
4. Update this file if you introduce new env vars, test categories, or workflow inputs.

---
Feedback: Please review for gaps (e.g. missing test types, undocumented env vars) and request refinements.
