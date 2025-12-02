# Test Standards for Product (Playwright) Specs

These rules apply to test files in `tests/test-team` (current naming: `*-e2e.ts`; future `*.spec.ts`). Copilot: use this as authoritative when suggesting edits.

## 1. File Structure
- Import order: Playwright test API, shared types, page objects, fixtures/auth helpers, data/constants, utils.
- Single top-level `describe('<area>: <action>')` per file (e.g. `letter-template: create`).
- No global side-effects; derive environment data from `process.env.TARGET_ENVIRONMENT`.

## 2. Test Naming & Layout
- Each test title starts with `should ` and describes an observable outcome (not implementation) e.g. `should create letter template proof`.
- Avoid multiple assertions checking the same semantic outcome — group related expectations.

## 3. Page Object Usage
- Interactions must call page object methods (e.g. `letterPage.uploadLetterTemplate()`); do not inline locator chains unless preceded by `// allowable direct locator`.
- Page objects contain: constructor + public methods that perform single actions; no test-specific assertions except basic visibility/state waits.

## 4. Selectors Priority
Order: `getByRole` > `getByTestId` > text regex (`/\W+Continue\W+/`) > CSS. Add a comment if deviating.

## 5. Environment & URLs
- Never hard-code full `https://` hostnames; base URL produced in Playwright config from `TARGET_ENVIRONMENT`.
- Security proxy: conditional block for `PLAYWRIGHT_ZAP_PROXY` only in config, not in test files.

## 6. Authentication
- Use `loginWithCis2` fixture/helper (DO NOT inline username/password/TOTP logic). Keep retry semantics (max 3 attempts) stable.

## 7. Polling & Retry
- Polling uses bounded loop: `for (i=0; i<maxRetries; i++) { ... waitForTimeout(interval) }` with explicit failure after max retries.
- Do not use `while(true)` or unbounded recursion.

## 8. Timing & Stability
- Prefer Playwright auto-waits + `expect(locator).toBeVisible()` over `waitForTimeout`.
- Discourage `page.waitForTimeout` (will trigger validator warning). Replace with locator-based waits or structured polling helper.
- `test.setTimeout(x)` must be <= 60_000 ms.

## 9. Assertions
- Critical path: use strict `expect`. Non-critical (UI decoration) may use soft assertions if needed (add comment `// soft: non-critical`).
- Do not assert on implementation details (like internal CSS class names) unless they are contractually required.

## 10. Logging & Secrets
- Use minimal `console.log` for high-level phase markers; never print credentials or TOTP codes.
- Traces stay `off` (see config comment) unless debugging; revert before merging.

## 11. Data & Fixtures
- Substantial sample data lives under a dedicated folder (e.g. `data/`). Avoid inlining large JSON blocks (>10 lines). Reference via helper loader.

## 12. Error Handling
- Throw `Error("<action>: <short reason>")` on unrecoverable situations (e.g. exceeded retries). Include context (template name / id) but not secrets.

## 13. Forbidden / Restricted
- Hard-coded domain literals (`https://...`) — use env-driven base URL.
- Unbounded loops.
- Direct `page.locator('selector')` without preceding annotation comment.
- Inline credentials or TOTP logic.
- Sleep-based waits without justification.

## 14. Review Checklist (Agent)
- [ ] Single top-level `describe()` name matches `<area>: <action>` pattern
- [ ] All test titles start with `should `
- [ ] No forbidden direct locators (or properly annotated)
- [ ] No hard-coded `https://` domains
- [ ] No unbounded loops
- [ ] No inline auth credentials
- [ ] `test.setTimeout` <= 60000
- [ ] Polling loops bounded & throw on exhaustion
- [ ] Selectors follow priority / comments explain exceptions
- [ ] Logging is minimal & non-sensitive
- [ ] Page object methods used for interactions

## 15. Minimal Compliant Example
```ts
import { test, expect } from '@playwright/test';
import { TemplateMgmtLetterPage } from '../pages/template-mgmt-letter-page';
import { loginWithCis2 } from '../fixtures/login';

test.describe('letter-template: create', () => {
  test('should upload and verify letter template proof', async ({ page }) => {
    const letterPage = new TemplateMgmtLetterPage(page);
    await letterPage.navigateTo(process.env.TARGET_ENVIRONMENT!); // base path usage
    await loginWithCis2(letterPage, 'Create a template');
    await letterPage.uploadLetterTemplate('My Test Template');
    await letterPage.waitForProofRequest();
    await letterPage.verifyFiles();
    await expect(page.getByText('Request a proof')).toBeVisible();
  });
});
```

## 16. Non-Compliant Snippet
```ts
// Issues: no should prefix; hard-coded URL; direct locator; sleep.
test('uploads template', async ({ page }) => {
  await page.goto('https://main.web-gateway.dev.nhsnotify.national.nhs.uk/templates');
  page.locator('#templatePdf').setInputFiles('template.pdf');
  await page.waitForTimeout(5000); // BAD: sleep-based
});
```

## 17. Auto-Remediation Guidance
Copilot: when user adds a test without `should ` prefix, propose renaming. When detecting direct locator, suggest wrapping logic in existing page object or adding annotation comment. When seeing hard-coded domain, prompt to use env-driven base URL.

## 18. Getting Inline Editor Warnings
Real-time standards feedback is provided via custom ESLint rules so authors can fix issues before running the validator or committing.

### 18.1 What Is Checked Inline
- Missing `should ` prefix on test titles.
- `test.setTimeout` above 60_000 ms.
- Direct locator usage (`page.locator(...)`) without an immediately preceding `// allowable direct locator` comment.

### 18.2 Enabling Inline Warnings
1. Ensure dependencies are installed (done automatically by `make config` or `npm install` at repo root).
2. Install / enable the VS Code ESLint extension.
3. Open a product test file (`*-e2e.ts` or `*.spec.ts`); ESLint diagnostics should appear as you type.

### 18.3 Running Lint Manually
Use the dedicated script: `npm run lint:product-tests` (runs ESLint only on product test files for speed). The pre-commit hook plus CI validator still run even if ESLint passes—ESLint is for author ergonomics; the validator enforces broader structural rules.

### 18.4 Suppressing Legitimate Direct Locators
Add a single comment directly above the line: `// allowable direct locator`. Keep usage rare and justified (complex dynamic selector, no stable role/testid available). The ESLint rule then ignores that locator; include a short rationale if not obvious.

### 18.5 Extending the Rule Set
Modify `scripts/eslint-rules/product-test-standards.js` to add or adjust checks (e.g., selector priority ordering). Then update `.eslintrc.cjs` if new rule names or config are introduced. Re-run `npm run lint:product-tests` to verify.

### 18.6 Common Troubleshooting
- No warnings shown: confirm the file matches expected patterns and ESLint extension is active; run the lint script—if it reports 0 files, revisit glob patterns.
- False positive on locator: ensure the comment is immediately above (no blank lines) and exactly `// allowable direct locator`.
- Performance lag: limit ESLint scope to ONLY product test files (already configured); avoid opening huge unrelated workspaces simultaneously.

### 18.7 Relationship to Validator
ESLint = near real-time authoring hints (fast, local). Validator script = authoritative structural gate (CI + pre-commit). Both must remain consistent—when adding new ESLint rules, consider mirroring critical ones in the validator for defense in depth.

## 19. Scaffolding New Product Tests
Use the generator script to produce a standards-compliant starting point and reduce drift.

### 19.1 Generator Usage
Run:
`npm run generate:product-test -- --area template-mgmt --action create-letter-template --outcome "upload and verify letter template proof"`

Flags:
- `--area` (required) logical area (e.g. template-mgmt)
- `--action` (required) action phrase (kebab-case recommended)
- `--outcome` (optional) test title outcome; defaults to action
- `--pageObject` (optional) override inferred page object class
- `--force` overwrite existing file
- `--dryRun` show target path only

### 19.2 Output Path Pattern
`tests/test-team/<area>-e2e-tests/<area>-<action>-e2e.ts`

### 19.3 Post-Generation Checklist
- Replace placeholder assertion with a meaningful `expect`
- Adjust page object import if needed
- Implement interactions using page object methods
- Remove `// allowable direct locator` comment if not needed

### 19.4 Rationale
Automates consistent describe/test title formatting, env-driven navigation, and login fixture usage. Encourages early standards adherence and lowers manual boilerplate errors.

---
Maintain this file when rules evolve; update validator & pre-commit hook accordingly.
