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
- Run all implemented test suites: `make test` (aggregates granular `make test-*` targets). Many test scripts are placeholders until implemented.
- Product Playwright tests:
  - Local fast path: `make test-product` → `scripts/tests/product.sh` → `npm run test:product` in `tests/test-team`.
  - CI dispatch: `.github/workflows/product-tests.yaml` triggers internal workflow.
- Set `TARGET_ENVIRONMENT` (defaults in `tests/.env`) for environment selection.

## Test Architecture & Patterns

- Page Object Model in `tests/test-team/pages/` (e.g. `template-mgmt-letter-page.ts`). Patterns:
  - Locator chaining with `.and()` + role-based selectors for resilience.
  - Bounded retry loops for eventually-consistent operations (upload + proof generation).
  - Env-driven base URL: `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk`.
  - Conditional proxy support via `PLAYWRIGHT_ZAP_PROXY` blocks in config only.
- Auth helper `fixtures/login.ts`: CIS2 MFA login (username/password + TOTP) with retry; do not inline credentials.
- Polling uses finite loop + explicit failure.

## Conventions

- Makefile target descriptions end with category `@Testing`, etc., parsed by custom help script—preserve format.
- Shell scripts use `set -euo pipefail` for safety.
- Page objects: no test assertions beyond visibility/state; keep single-responsibility methods.
- Prefer role / data-testid / text regex over brittle CSS selectors.

## Extending Tests

- New test workspace: add under `tests/` and include in root `package.json` workspaces if dependencies shared.
- Add script + make target for new test types.
- Align additional Playwright reporters with existing HTML + JUnit.
- Keep traces disabled to avoid leaking secrets (`trace: 'off'` unless temporary debug; revert before merge).

## CI/CD Integration

- Staged workflows call `make test-*` directly.
- Scheduled product/security tests dispatch internal workflows with environment inputs.
- Static analysis via local composite action (SonarCloud) — update action to extend language coverage.

## Environment & Credentials

- Env vars: `TARGET_ENVIRONMENT`, `PLAYWRIGHT_ZAP_PROXY`. Add new ones here & in standards when introduced.
- CIS2 credentials abstracted via shared provider `getCis2Credentials()` — never inline secrets.

## Safe Change Guidelines

- Don’t edit template-managed `scripts/init.mk` & `scripts/tests/test.mk` except for urgent local debug (revert after).
- Maintain retry bounds to protect CI time.
- Use resilient selectors; avoid coupling to fragile DOM specifics.

## Product Test Standards (Summary for Copilot)

Refer to full rules in `tests/test-team/standards/TEST_STANDARDS.md`. Enforce during suggestions:
- Single top-level `describe('<area>: <action>')` per test file.
- Test titles start with `should `.
- Interactions via page object methods; direct `page.locator()` only after `// allowable direct locator` comment.
- Selector order: role > testid > text regex > CSS (document exceptions).
- No hard-coded `https://` domains; derive from `process.env.TARGET_ENVIRONMENT`.
- Bounded polling loops (no `while(true)`); throw on exhaustion.
- `test.setTimeout` ≤ 60000 ms.
- Avoid `waitForTimeout`; prefer locator waits or structured polling.
- Use `loginWithCis2` helper (no inline auth/TOTP logic).
- Traces remain off; toggle only for temporary debug.
- Minimal logging, never secrets; critical paths = hard `expect`, optional UI = soft (annotate).

## Copilot Inline Prompts (Examples)

When editing a test file, auto-suggest improvements:
1. If title missing prefix: “Rename test to start with ‘should ’ (e.g. `should delete letter template`).”
2. Direct locator found: “Wrap this interaction in a page object or add `// allowable direct locator` above; current selector may be brittle.”
3. Hard-coded URL: “Replace literal URL with env-driven base: `await page.goto(<baseURL>/path)` where baseURL uses TARGET_ENVIRONMENT.”
4. Unbounded loop: “Refactor to bounded retry: `for (let i=0; i<maxRetries; i++) { ... }` then throw on failure.”
5. Sleep found: “Replace sleep with `await expect(locator).toBeVisible()` or polling helper.”

## Copilot Chat Prompt Library

For a richer set of ready-to-use prompts covering creation, refactoring, auditing, resilience, and metrics, see: `tests/test-team/copilot-prompts.md`.

Recommended usage:
- Open a product test file and paste a focused prompt (e.g. “Audit selector priority and propose role-based alternatives”).
- Apply incremental fixes; re-run `npm run lint:product-tests` and `npm run validate:product-tests` to confirm.
- For new tests, start with the scaffolder then use prompts to refine assertions and selectors.

Keep the prompt library updated when standards evolve or new automation (ESLint rules / validators) is introduced.

## Metrics Dashboard (Product Tests)
Generated via `npm run metrics:product-tests` producing `tests/test-team/metrics/product-test-metrics.json`.

Included metrics:
- Selector usage counts (role, testid, text, css, directLocator)
- Total tests & tests per file
- Duplicate test titles
- Describe pattern compliance
- Area/action mapping
- Large inline data warnings
- Timeout usages (with annotation status)
- Polling loop patterns (bounded vs unbounded)

Recommended usage:
1. Run metrics before PR to identify drift (e.g. rising directLocator usage).
2. Address violations (add missing describe blocks, replace brittle selectors).
3. Commit refreshed metrics JSON (optional; or generate in CI for comparison).

Future enhancements (optional): add trend comparison and selector improvement targets.

### Metrics Trend CI
A pull request workflow (`product-test-metrics-trend.yaml`) generates current metrics, fetches base branch metrics, compares for regressions (direct locator increases, describe validity regressions, role selector usage drop, new duplicate titles, unbounded loop increases). It fails the PR if regressions detected.

Run locally to preview:
`npm run metrics:product-tests && cp tests/test-team/metrics/product-test-metrics.json tests/test-team/metrics/base-product-test-metrics.json && npm run metrics:compare`

Extending regressions:
- Add thresholds (e.g. allow +1 direct locator) by updating `compare-product-test-metrics.ts` logic.
- Include new metrics (timeout increases, large inline data block growth).

## Quick Start (Agent)

1. Run `make config`.
2. Set `TARGET_ENVIRONMENT=main` and run `make test-product`.
3. Add/modify tests following standards; rely on page objects.
4. Run `npm run validate:product-tests` before committing.

---
Feedback: Request refinements (missing test types, env vars) to evolve these instructions.
