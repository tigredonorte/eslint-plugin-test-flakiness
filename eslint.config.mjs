import js from '@eslint/js';
import testFlakiness from './lib/index.js';  // Import your own plugin!

export default [
  js.configs.recommended,
  {
    // Base configuration for all JS files
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
  {
    // Apply your flakiness rules to test files
    files: [
      '**/*.test.js',
      '**/*.spec.js',
      'test/**/*.js',
      'examples/**/*.test.js'
    ],
    plugins: {
      'test-flakiness': testFlakiness
    },
    rules: {
      'test-flakiness/no-hard-coded-timeout': 'error',
      'test-flakiness/await-async-events': 'error',
      'test-flakiness/no-immediate-assertions': 'error',
      'test-flakiness/no-index-queries': 'warn',
      'test-flakiness/no-unconditional-wait': 'error',
      'test-flakiness/no-unmocked-network': 'warn',
      'test-flakiness/no-promise-race': 'warn',
      'test-flakiness/no-global-state-mutation': 'warn',
      'test-flakiness/no-element-removal-check': 'warn',
      'test-flakiness/no-random-data': 'off',
      'test-flakiness/no-long-text-match': 'off',
      'test-flakiness/no-viewport-dependent': 'off',
      'test-flakiness/no-focus-check': 'warn',
      'test-flakiness/no-unmocked-fs': 'warn',
      'test-flakiness/no-database-operations': 'warn',
    }
  },
  {
    // Special configuration for rule test files
    // These files intentionally contain "bad" patterns to test the rules
    files: [
      'lib/rules/**/*.test.js',
      'test/rules/**/*.js',
      'test/rules/**/*.spec.js',
      '__tests__/rules/**/*.js'
    ],
    rules: {
      // Disable ALL your plugin rules for rule tests
      // since they'll have intentionally flaky patterns
      'test-flakiness/no-hard-coded-timeout': 'off',
      'test-flakiness/await-async-events': 'off',
      'test-flakiness/no-immediate-assertions': 'off',
      'test-flakiness/no-index-queries': 'off',
      'test-flakiness/no-unconditional-wait': 'off',
      'test-flakiness/no-unmocked-network': 'off',
      'test-flakiness/no-promise-race': 'off',
      'test-flakiness/no-global-state-mutation': 'off',
      'test-flakiness/no-element-removal-check': 'off',
      'test-flakiness/no-random-data': 'off',
      'test-flakiness/no-long-text-match': 'off',
      'test-flakiness/no-viewport-dependent': 'off',
      'test-flakiness/no-focus-check': 'off',
      'test-flakiness/no-unmocked-fs': 'off',
      'test-flakiness/no-database-operations': 'off',
    }
  },
  {
    // Example files might also have intentional bad patterns
    files: ['examples/**/*.js'],
    rules: {
      'test-flakiness/no-hard-coded-timeout': 'off',
      'test-flakiness/await-async-events': 'off',
      'test-flakiness/no-immediate-assertions': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js',
      '.husky/**',
    ],
  },
];
