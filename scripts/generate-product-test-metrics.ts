#!/usr/bin/env tsx
// Product Test Metrics Generator
// Scans product test files (patterns: tests/test-team/**/*-e2e.ts and tests/test-team/**/*.spec.ts) and outputs JSON metrics.
// Metrics:
//  - totalTestFiles
//  - totalTests
//  - testsPerFile [{ file, testCount }]
//  - duplicateTestTitles [{ title, files }]
//  - selectorsUsage (role, testid, text, css, directLocator)
//  - describePatterns [{ file, describeName, valid }]
//  - areaActionCounts [{ area, action, files }]
//  - largeInlineDataWarnings [{ file, lines }]
//  - timeoutUsages [{ file, value, annotated }]
//  - pollingPatterns (boundedLoops, unboundedLoops)
// Output: tests/test-team/metrics/product-test-metrics.json

import fg from 'fast-glob';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Metrics {
  generatedAt: string;
  totalTestFiles: number;
  totalTests: number;
  testsPerFile: { file: string; testCount: number }[];
  duplicateTestTitles: { title: string; files: string[] }[];
  selectorsUsage: { role: number; testid: number; text: number; css: number; directLocator: number };
  describePatterns: { file: string; describeName: string | null; valid: boolean }[];
  areaActionCounts: { area: string; action: string; files: string[] }[];
  largeInlineDataWarnings: { file: string; lines: number }[];
  timeoutUsages: { file: string; value: number; annotated: boolean }[];
  pollingPatterns: { boundedLoops: { file: string; count: number }[]; unboundedLoops: { file: string; count: number }[] };
}

async function collectFiles(): Promise<string[]> {
  return await fg([
    'tests/test-team/**/*-e2e.ts',
    'tests/test-team/**/*.spec.ts',
    '!**/node_modules/**'
  ]);
}

function extractTests(content: string): string[] {
  const regex = /test\s*\(\s*[`'\"]([^`'\"]+)/g;
  const titles: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content))) {
    titles.push(m[1].trim());
  }
  return titles;
}

function extractDescribe(content: string): string | null {
  const m = /describe\s*\(\s*[`'\"]([^`'\"]+)/.exec(content);
  return m ? m[1].trim() : null;
}

function classifySelectors(content: string) {
  return {
    role: (content.match(/getByRole\(/g) || []).length,
    testid: (content.match(/getByTestId\(/g) || []).length,
    text: (content.match(/getByText\(/g) || []).length,
    css: (content.match(/\.locator\(['`\"][^)]*['`\"]\)/g) || []).length,
    directLocator: (content.match(/page\.locator\(/g) || []).length
  };
}

function findTimeouts(content: string) {
  const results: { value: number; annotated: boolean }[] = [];
  const regex = /test\.setTimeout\((\d+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content))) {
    const value = parseInt(m[1], 10);
    // annotation comment check in preceding 3 lines
    const startIdx = m.index;
    const preceding = content.slice(Math.max(0, startIdx - 300), startIdx);
    const annotated = /allowable timeout/.test(preceding);
    results.push({ value, annotated });
  }
  return results;
}

function findLargeInlineData(content: string) {
  // crude heuristic: block of JSON-like lines > 10 lines with { and }
  const lines = content.split(/\n/);
  const warnings: { lines: number }[] = [];
  let currentCount = 0;
  let inBlock = false;
  for (const line of lines) {
    if (/\{/.test(line) && !inBlock) {
      inBlock = true; currentCount = 1; continue;
    }
    if (inBlock) {
      currentCount++;
      if (/\}/.test(line)) {
        if (currentCount > 12) warnings.push({ lines: currentCount });
        inBlock = false; currentCount = 0;
      }
    }
  }
  return warnings;
}

function findPolling(content: string) {
  const bounded = (content.match(/for\s*\(let\s+\w+\s*=\s*0;\s*\w+\s*<\s*maxRetries/g) || []).length;
  const unbounded = (content.match(/while\s*\(true\)/g) || []).length + (content.match(/for\s*\(;;\)/g) || []).length;
  return { bounded, unbounded };
}

function validDescribe(name: string | null): boolean {
  if (!name) return false;
  return /^[a-z0-9-]+: [a-z0-9-]+$/.test(name);
}

function parseAreaAction(name: string | null) {
  if (!name) return null;
  const parts = name.split(':').map(p => p.trim());
  if (parts.length !== 2) return null;
  return { area: parts[0], action: parts[1] };
}

async function generateMetrics(): Promise<Metrics> {
  const files = await collectFiles();
  const selectorTotals = { role: 0, testid: 0, text: 0, css: 0, directLocator: 0 };
  const testsPerFile: { file: string; testCount: number }[] = [];
  const describePatterns: { file: string; describeName: string | null; valid: boolean }[] = [];
  const timeoutUsages: { file: string; value: number; annotated: boolean }[] = [];
  const largeInlineDataWarnings: { file: string; lines: number }[] = [];
  const areaActionMap: Map<string, { area: string; action: string; files: Set<string> }> = new Map();
  const allTestTitles: Map<string, Set<string>> = new Map();
  const pollingBounded: { file: string; count: number }[] = [];
  const pollingUnbounded: { file: string; count: number }[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const tests = extractTests(content);
    testsPerFile.push({ file, testCount: tests.length });
    for (const t of tests) {
      if (!allTestTitles.has(t)) allTestTitles.set(t, new Set());
      allTestTitles.get(t)!.add(file);
    }
    const describeName = extractDescribe(content);
    describePatterns.push({ file, describeName, valid: validDescribe(describeName) });
    const areaAction = parseAreaAction(describeName);
    if (areaAction) {
      const key = `${areaAction.area}:${areaAction.action}`;
      if (!areaActionMap.has(key)) {
        areaActionMap.set(key, { area: areaAction.area, action: areaAction.action, files: new Set() });
      }
      areaActionMap.get(key)!.files.add(file);
    }
    const selectors = classifySelectors(content);
    selectorTotals.role += selectors.role;
    selectorTotals.testid += selectors.testid;
    selectorTotals.text += selectors.text;
    selectorTotals.css += selectors.css;
    selectorTotals.directLocator += selectors.directLocator;
    const timeouts = findTimeouts(content);
    timeouts.forEach(t => timeoutUsages.push({ file, value: t.value, annotated: t.annotated }));
    const largeBlocks = findLargeInlineData(content);
    largeBlocks.forEach(b => largeInlineDataWarnings.push({ file, lines: b.lines }));
    const polling = findPolling(content);
    if (polling.bounded) pollingBounded.push({ file, count: polling.bounded });
    if (polling.unbounded) pollingUnbounded.push({ file, count: polling.unbounded });
  }

  const duplicateTestTitles = Array.from(allTestTitles.entries())
    .filter(([_, filesSet]) => filesSet.size > 1)
    .map(([title, filesSet]) => ({ title, files: Array.from(filesSet) }));

  return {
    generatedAt: new Date().toISOString(),
    totalTestFiles: files.length,
    totalTests: testsPerFile.reduce((sum, f) => sum + f.testCount, 0),
    testsPerFile,
    duplicateTestTitles,
    selectorsUsage: selectorTotals,
    describePatterns,
    areaActionCounts: Array.from(areaActionMap.values()).map(v => ({ area: v.area, action: v.action, files: Array.from(v.files) })),
    largeInlineDataWarnings,
    timeoutUsages,
    pollingPatterns: { boundedLoops: pollingBounded, unboundedLoops: pollingUnbounded }
  };
}

function writeMetrics(metrics: Metrics) {
  const outDir = join('tests', 'test-team', 'metrics');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'product-test-metrics.json');
  writeFileSync(outFile, JSON.stringify(metrics, null, 2));
  console.log(`Metrics written: ${outFile}`);
}

async function main() {
  const metrics = await generateMetrics();
  writeMetrics(metrics);
}

main().catch(err => {
  console.error('Metrics generation failed:', err);
  process.exit(1);
});
