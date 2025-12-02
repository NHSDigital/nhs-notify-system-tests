#!/usr/bin/env tsx
/**
 * Compare Product Test Metrics
 * Usage: tsx scripts/compare-product-test-metrics.ts --base tests/test-team/metrics/base-product-test-metrics.json --current tests/test-team/metrics/product-test-metrics.json
 * Exits non-zero on regression according to thresholds.
 */

import { readFileSync, existsSync } from 'fs';

interface Metrics {
  selectorsUsage: { role: number; testid: number; text: number; css: number; directLocator: number };
  describePatterns: { file: string; describeName: string | null; valid: boolean }[];
  duplicateTestTitles: { title: string; files: string[] }[];
  pollingPatterns: { boundedLoops: { file: string; count: number }[]; unboundedLoops: { file: string; count: number }[] };
  timeoutUsages: { file: string; value: number; annotated: boolean }[];
  totalTests: number;
  totalTestFiles: number;
}

function parseArgs() {
  const args: Record<string, string> = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const token = raw[i];
    if (!token.startsWith('--')) continue;
    const key = token.replace(/^--/, '');
    const next = raw[i + 1];
    if (next && !next.startsWith('--')) { args[key] = next; i++; } else { args[key] = 'true'; }
  }
  return args;
}

function loadMetrics(path: string): Metrics | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as Metrics;
}

interface Regression { code: string; message: string; current?: any; base?: any; }

function compare(base: Metrics | null, current: Metrics): Regression[] {
  const regressions: Regression[] = [];
  if (!base) {
    // No base metrics; treat as initial baseline.
    return regressions;
  }

  // 1. Direct locator increase
  if (current.selectorsUsage.directLocator > base.selectorsUsage.directLocator) {
    regressions.push({
      code: 'DIRECT_LOCATOR_INCREASE',
      message: `Direct locator count increased from ${base.selectorsUsage.directLocator} to ${current.selectorsUsage.directLocator}.`,
      base: base.selectorsUsage.directLocator,
      current: current.selectorsUsage.directLocator
    });
  }

  // 2. Describe validity regression (more invalid describes)
  const baseInvalid = base.describePatterns.filter(p => !p.valid).length;
  const currentInvalid = current.describePatterns.filter(p => !p.valid).length;
  if (currentInvalid > baseInvalid) {
    regressions.push({
      code: 'DESCRIBE_INVALID_INCREASE',
      message: `Invalid describe blocks increased from ${baseInvalid} to ${currentInvalid}.`,
      base: baseInvalid,
      current: currentInvalid
    });
  }

  // 3. Role selector usage drop beyond threshold (5%)
  const roleBase = base.selectorsUsage.role;
  const roleCurrent = current.selectorsUsage.role;
  if (roleBase > 0 && roleCurrent < roleBase * 0.95) {
    regressions.push({
      code: 'ROLE_USAGE_DROP',
      message: `Role selector usage dropped more than 5% (${roleBase} -> ${roleCurrent}).`,
      base: roleBase,
      current: roleCurrent
    });
  }

  // 4. New duplicate test titles
  const baseTitles = new Set(base.duplicateTestTitles.map(d => d.title));
  for (const dup of current.duplicateTestTitles) {
    if (!baseTitles.has(dup.title)) {
      regressions.push({
        code: 'NEW_DUPLICATE_TITLE',
        message: `New duplicate test title introduced: '${dup.title}'.`,
        current: dup.files
      });
    }
  }

  // 5. Unbounded loop increase
  const baseUnbounded = base.pollingPatterns.unboundedLoops.reduce((s, f) => s + f.count, 0);
  const currentUnbounded = current.pollingPatterns.unboundedLoops.reduce((s, f) => s + f.count, 0);
  if (currentUnbounded > baseUnbounded) {
    regressions.push({
      code: 'UNBOUNDED_LOOP_INCREASE',
      message: `Unbounded loop occurrences increased from ${baseUnbounded} to ${currentUnbounded}.`,
      base: baseUnbounded,
      current: currentUnbounded
    });
  }

  return regressions;
}

function main() {
  const args = parseArgs();
  const basePath = args.base || 'tests/test-team/metrics/base-product-test-metrics.json';
  const currentPath = args.current || 'tests/test-team/metrics/product-test-metrics.json';

  const baseMetrics = loadMetrics(basePath);
  const currentMetrics = loadMetrics(currentPath);

  if (!currentMetrics) {
    console.error(`Current metrics file missing: ${currentPath}`);
    process.exit(1);
  }

  const regressions = compare(baseMetrics, currentMetrics);

  const summary = {
    baseExists: !!baseMetrics,
    regressionCount: regressions.length,
    regressions
  };
  console.log(JSON.stringify(summary, null, 2));

  if (regressions.length > 0) {
    console.error('Metrics regression detected.');
    process.exit(1);
  }
}

main();
