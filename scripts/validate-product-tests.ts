/*
 * Static linter for product Playwright specs under tests/test-team.
 * Usage: npx tsx scripts/validate-product-tests.ts
 * Outputs JSON to stdout summarising violations and warnings.
 */

// Attempt to load fast-glob; give a clear instruction if missing.
let fg: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  fg = require('fast-glob');
} catch (e) {
  console.error('[validate-product-tests] fast-glob not installed.');
  console.error('Run: npm install (or npm ci) at repository root, then re-run validator.');
  process.exit(2);
}
import fs from 'fs';
import path from 'path';

interface Violation {
  file: string;
  line: number;
  rule: string; // e.g. ST-DESCRIBE-COUNT
  message: string;
}

interface Warning {
  file: string;
  line: number;
  rule: string;
  message: string;
}

interface Report {
  summary: {
    filesChecked: number;
    violations: number;
    warnings: number;
    failed: boolean;
  };
  violations: Violation[];
  warnings: Warning[];
}

// Configurable constants
const ROOT = process.cwd();
// Match current product test naming (*-e2e.ts) plus future *.spec.ts.
// fast-glob doesn't support the extglob grouping we attempted; use explicit patterns.
const SPEC_PATTERNS = [
  'tests/test-team/**/*-e2e.ts',
  'tests/test-team/**/*.spec.ts'
];
const MAX_TIMEOUT = 60_000; // threshold for test.setTimeout

// Simple utilities
function readFileLines(file: string): string[] {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/);
}

function pushViolation(arr: Violation[], file: string, line: number, rule: string, message: string) {
  arr.push({ file, line, rule, message });
}

function pushWarning(arr: Warning[], file: string, line: number, rule: string, message: string) {
  arr.push({ file, line, rule, message });
}

function findTopLevelDescribe(lines: string[]): { count: number; firstLine: number } {
  // A naive approach: count describe( occurrences not indented inside another describe using brace tracking.
  let count = 0;
  let firstLine = -1;
  // We'll track nesting by counting opening vs closing braces, but this is simplistic—acceptable for lint purpose.
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Adjust depth before matching so a describe at depth 0 is top-level
    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;
    if (/describe\s*\(/.test(line) && depth === 1) { // depth 1 after consuming opening of describe block parent
      count++;
      if (firstLine === -1) firstLine = i + 1;
    }
  }
  return { count, firstLine };
}

function extractTestTitles(lines: string[]): { line: number; title: string }[] {
  const titles: { line: number; title: string }[] = [];
  const regex = /test\s*\(\s*['"`]([^'"`]+)['"`]/;
  lines.forEach((l, idx) => {
    const m = l.match(regex);
    if (m) titles.push({ line: idx + 1, title: m[1] });
  });
  return titles;
}

function hasAllowableLocatorComment(lines: string[], index: number): boolean {
  // Look backward up to 3 lines for the comment
  for (let i = Math.max(0, index - 3); i < index; i++) {
    if (/\/\/\s*allowable direct locator/.test(lines[i])) return true;
  }
  return false;
}

function scanFile(file: string): { violations: Violation[]; warnings: Warning[] } {
  const violations: Violation[] = [];
  const warnings: Warning[] = [];

  const lines = readFileLines(file);

  // 1. Single top-level describe
  const { count, firstLine } = findTopLevelDescribe(lines);
  if (count === 0) {
    pushViolation(violations, file, 1, 'ST-DESCRIBE-COUNT', 'No top-level describe() found');
  } else if (count > 1) {
    pushViolation(violations, file, firstLine, 'ST-DESCRIBE-COUNT', `Multiple top-level describe() blocks detected (${count})`);
  }

  // 2. Test titles start with 'should '
  extractTestTitles(lines).forEach(t => {
    if (!t.title.startsWith('should ')) {
      pushViolation(violations, file, t.line, 'ST-TITLE-PREFIX', `Test title must start with 'should ': "${t.title}"`);
    }
  });

  // 3. No direct page.locator('css ...') without comment
  lines.forEach((line, idx) => {
    if (/page\.locator\(\s*['"`][^'"`]*['"`]\s*\)/.test(line) && !hasAllowableLocatorComment(lines, idx)) {
      pushViolation(violations, file, idx + 1, 'ST-DIRECT-LOCATOR', 'Direct page.locator usage without preceding // allowable direct locator comment');
    }
  });

  // 4. Reject test.setTimeout(...) > MAX_TIMEOUT
  lines.forEach((line, idx) => {
    const m = /test\.setTimeout\(\s*(\d+)\s*\)/.exec(line);
    if (m) {
      const val = parseInt(m[1], 10);
      if (val > MAX_TIMEOUT) {
        pushViolation(violations, file, idx + 1, 'ST-TIMEOUT-LIMIT', `test.setTimeout(${val}) exceeds ${MAX_TIMEOUT}`);
      }
    }
  });

  // 5. Warn on sleep/waitForTimeout
  lines.forEach((line, idx) => {
    if (/sleep\s*\(/.test(line) || /waitForTimeout\s*\(/.test(line)) {
      pushWarning(warnings, file, idx + 1, 'ST-WARN-SLEEP', 'Use polling + expect instead of sleep/waitForTimeout');
    }
  });

  // 6. Fail on any hard-coded https:// domain
  lines.forEach((line, idx) => {
    if (/https:\/\//.test(line) && !/process\.env\.TARGET_ENVIRONMENT/.test(line)) {
      pushViolation(violations, file, idx + 1, 'ST-HARDCODED-DOMAIN', 'Hard-coded https:// domain found; derive from TARGET_ENVIRONMENT');
    }
  });

  return { violations, warnings };
}

async function main() {
  const specFiles = await fg(SPEC_PATTERNS, { dot: false });
  if (specFiles.length === 0) {
    console.warn('[validate-product-tests] No matching test files. Patterns tried:', SPEC_PATTERNS.join(', '));
  }
  const allViolations: Violation[] = [];
  const allWarnings: Warning[] = [];

  for (const file of specFiles) {
    const { violations, warnings } = scanFile(path.resolve(ROOT, file));
    allViolations.push(...violations);
    allWarnings.push(...warnings);
  }

  const report: Report = {
    summary: {
      filesChecked: specFiles.length,
      violations: allViolations.length,
      warnings: allWarnings.length,
      failed: allViolations.length > 0,
    },
    violations: allViolations,
    warnings: allWarnings,
  };

  const json = JSON.stringify(report, null, 2);
  console.log(json);

  if (report.summary.failed) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('Validator crashed', err);
  process.exit(2);
});
