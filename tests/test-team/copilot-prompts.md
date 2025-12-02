# Copilot Chat Prompt Library (Product Tests)

Use these curated prompts in Copilot Chat to enforce and improve Playwright product test standards. Adapt specifics (template names, selectors) but keep structural rules intact. Avoid secrets or credentials.

## 1. Test File Creation & Scaffolding
**Create new test file**
"Generate a product test for area template-mgmt and action create-letter-template that uploads a template and verifies the proof, using the scaffolder conventions."

**Refine generated boilerplate**
"Rewrite the placeholder assertion in this file to a resilient role-based assertion confirming the proof request button appears."

## 2. Naming & Structure Enforcement
**Enforce describe format**
"Audit this file: ensure a single top-level describe('<area>: <action>') and suggest a compliant name if wrong."

**Ensure should prefix**
"List any test titles missing the 'should ' prefix and provide corrected titles."

## 3. Page Object Refactoring
**Wrap direct locators**
"Identify every direct page.locator call not annotated; for each, propose a page object method signature and implementation stub."

**Extract repeated locator chains**
"Find locator chains used more than twice and suggest a page object method to encapsulate them."

## 4. Selector Quality & Resilience
**Improve selector priority**
"Review all selectors and suggest role or testid alternatives where text or CSS is used. Explain why each change improves resilience."

**Detect brittle selectors**
"Flag selectors relying on exact text with punctuation or dynamic IDs; propose robust regex or role-based alternatives."

## 5. Polling & Timing
**Standardize polling loops**
"Replace any ad-hoc sleeps with a bounded polling loop template (maxRetries + interval + explicit throw)."

**Timeout audit**
"Check for test.setTimeout calls over 60000 ms and show a refactored plan to reduce runtime instead of increasing timeout."

## 6. Environment & URLs
**Remove hard-coded domains**
"Scan this file for hard-coded https URLs; rewrite navigation to use the env-driven base URL derived from TARGET_ENVIRONMENT."

**Base URL injection**
"Add a helper line at top retrieving base URL then refactor page.goto calls to use it."

## 7. Assertions Quality
**Critical vs soft assertions**
"Classify each assertion as critical path or optional UI; annotate optional ones with // soft: non-critical."

**Over-assertion reduction**
"Detect clusters of assertions verifying the same outcome; consolidate them into a single expressive assertion."

## 8. Logging & Noise Control
**Minimal logging pass**
"Remove or downgrade logging lines that are redundant; keep only phase markers."

## 9. Security & Secrets
**Credential safety check**
"Verify no inline credentials/TOTP logic appear; if found, replace with loginWithCis2 usage."

## 10. Large Data & Fixtures
**Inline data extraction**
"Identify large inline JSON blobs or constants and propose relocating them to a shared data fixture file with import statements."

## 11. Standards Compliance Summary
**Full compliance report**
"Generate a checklist pass/fail summary for this test file against TEST_STANDARDS.md Sections 1–17."

**Auto-remediation diff**
"Produce a patch-style summary showing minimal edits to bring the file to standards compliance (no secrets)."

## 12. ESLint & Validator Alignment
**Explain ESLint findings**
"Explain each ESLint custom rule violation and give a one-line fix suggestion per violation."

**Propose new rule**
"Suggest an ESLint rule to detect duplicate test titles across files and outline its implementation approach."

## 13. Reliability / Flakiness
**Flakiness sweep**
"Identify potential flakiness sources (timing, dynamic content waits) and propose robust waits or page object abstractions."

**Retry strategy check**
"Evaluate polling loops for excessive iteration counts; suggest tuning maxRetries and intervals for faster failure detection."

## 14. Cross-File Audits (Run in repo root)
**Duplicate titles audit**
"List every duplicate test title across product test files and propose unique rewrites."

**Locator usage statistics**
"Summarize selector usage percentages (role/testid/text/css) across all product tests and suggest improvement targets."

## 15. Scaffold Enhancement
**Upgrade scaffold output**
"Enhance the scaffolded boilerplate: add TODO comments guiding replacement of placeholder assertion and removal of allowable direct locator annotation once converted."

## 16. Quick Fix Prompts (One-liners)
- "Rename test titles to start with 'should '."
- "Convert hard-coded URL navigation to env-driven base URL."
- "Wrap direct locators in page object methods."
- "Replace sleep/waitForTimeout with bounded polling template."
- "Add // soft: non-critical annotation to optional visual assertion lines."

## 17. Advanced Refactors
**Group page actions**
"Suggest a composite page object method combining upload + proof wait sequence with built-in polling and error handling."

**Introduce shared constants**
"Refactor all magic numbers for timeouts/poll retries into a constants file and update imports accordingly."

## 18. Metrics & Reporting Support
**Add selector metrics script**
"Provide a Node script outline to count selector types (role vs testid vs text vs css) in product tests."

**Coverage intention**
"List untested actions in template management area based on existing test file names and propose new test scaffolds."

## 19. Copilot Conversation Starters (Meta)
Use these to begin iterative improvement sessions:
- "What are the top 5 deviations from standards in this test file?"
- "Produce a prioritized fix order minimizing runtime risk."
- "Show me resilient selector alternatives for every direct locator."
- "Suggest page object method names for repeated action sequences here."

---
Keep this library updated as new standards or tooling appear. Each prompt aims for actionable, minimal-drift improvements.
