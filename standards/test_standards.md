# Product Test Standards: Playwright (tests/test-team)

## 1. Test Structure
- Each file must have a single top-level `describe('<area>: <action>')` block.
- All test titles must start with `should ` (e.g., `test('should display error on invalid input')`).

## 2. Page Object & Locator Usage
- Use page objects for all page interactions.
- Direct locator usage is only allowed if immediately preceded by `// allowable direct locator` comment.

## 3. Selector Priority
- Prefer selectors in this order:
  1. [role] (e.g., `getByRole`)
  2. [data-testid] (e.g., `getByTestId`)
  3. Text regex (e.g., `getByText(/submit/i)`)
  4. CSS selectors (only if above are not feasible)

## 4. Environment & URLs
- Never hard-code `https://` domains. Always derive base URLs from `process.env.TARGET_ENVIRONMENT`.

## 5. Polling & Timeouts
- All polling loops must be bounded (no `while(true)` or unbounded retries).
- `test.setTimeout` per test must not exceed 60,000ms (60s).
- Avoid `waitForTimeout`; use event-based waits. If used, add a comment: `// warn: avoid waitForTimeout`.

## 6. Authentication
- Use the provided login fixture for authentication.
- Never include inline credentials or TOTP secrets in test code.

## 7. Logging & Tracing
- Keep logging minimal and relevant.
- Never log secrets or sensitive data.
- Tracing must be off unless running in debug mode.

## 8. Error Handling
- On resource exhaustion or repeated failure, throw with context: `throw Error('<action>: <reason>')`.

---

### Example
```js
describe('user: login', () => {
  test('should show error for invalid password', async ({ page, login }) => {
    await login('user');
    // allowable direct locator
    await page.locator('[data-testid="password"]').fill('wrong');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});
```

---

**Enforcement:**
- PRs violating these standards will be rejected.
- Use ESLint and code review to enforce rules.
- For questions, contact the test-team maintainers.
