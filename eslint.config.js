// Flat ESLint v9 configuration for product test standards
// Migrated from legacy .eslintrc.cjs

const productTestStandardsRule = require('./scripts/eslint-rules/product-test-standards.js');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/playwright-report/**',
      '**/test-results/**'
    ]
  },
  {
    files: [
      'tests/test-team/**/*-e2e.ts',
      'tests/test-team/**/*.spec.ts'
    ],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' }
    },
    plugins: {
      // Provide plugin object with rules property for flat config
      'product-test-standards': { rules: productTestStandardsRule.rules }
    },
    rules: {
      'product-test-standards/test-title-prefix': 'error',
      'product-test-standards/test-timeout-limit': 'error',
      'product-test-standards/no-direct-page-locator': 'error'
    }
  }
];
