You are an AI coding agent for nhs-notify-system-tests. Using .github/copilot-instructions.md and existing patterns under tests/test-team, generate a new standards file:

filepath: tests/test-team/standards/TEST_STANDARDS.md

Requirements:
- Title: Test Standards for Product (Playwright) Specs
- Scope: ONLY tests in tests/test-team
- Define mandatory structure for each spec file:
  1. Import order (Playwright test, page objects, fixtures, data, utils)
  2. Single top-level describe naming convention: product-area: action (e.g. "letter-template: create")
  3. Test naming: must start with should (e.g. should create draft letter template)
  4. Use page object methods; no direct locator chains in specs except waits for unique, one-off assertions
  5. Authentication must use existing login fixture (do not inline CIS2 credentials)
  6. Polling: follow bounded retry pattern (maxRetries + interval) — never while(true)
  7. Selectors preference order: getByRole > getByTestId > text regex > CSS (last resort)
  8. Environment usage: base URL derived from TARGET_ENVIRONMENT variable (no hard-coded domains)
  9. Artifact logging: avoid console.log secrets; allow console.log high-level progress only
 10. Assertions: prefer expect soft only for non-critical UI embellishments; critical paths use hard expect
 11. Prohibit sleep-based waits; use expect + locator wait or explicit helper polling
 12. Traces must remain disabled (trace: 'off') unless a temporary debug branch (document if enabled)
 13. New page objects: constructor sets root locator + key elements; no test assertions inside page object methods
 14. Data files (fixtures/test data) live under tests/test-team/data; no inline large JSON blobs
 15. Error handling: throw descriptive Error including action + selector on unrecoverable failures

Add section: Review Checklist (bulleted list) an agent applies before accepting a new test.

Add section: Examples showing a compliant minimal spec and a non-compliant snippet (explain why).

Be concise (<= 120 lines), markdown headings, no aspirational items—only enforce patterns already used here.
