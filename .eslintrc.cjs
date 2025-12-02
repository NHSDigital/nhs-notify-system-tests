/* ESLint configuration focused on product test standards enforcement */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: [
    '@typescript-eslint',
    require.resolve('./scripts/eslint-rules/product-test-standards.js')
  ],
  env: { es2022: true, node: true },
  ignorePatterns: ['node_modules/', 'dist/', '**/playwright-report/**', '**/test-results/**'],
  rules: {
    // Turn off noisy defaults; we only care about custom standards here
  },
  overrides: [
    {
      files: [
        'tests/test-team/**/*.{spec,e2e}.ts',
        'tests/test-team/**/*-e2e.ts'
      ],
      plugins: ['product-test-standards'],
      rules: {
        'product-test-standards/test-title-prefix': 'error',
        'product-test-standards/test-timeout-limit': 'error',
        'product-test-standards/no-direct-page-locator': 'error'
      }
    }
  ]
};
