import js from '@eslint/js';
import testFlakiness from './lib/index.js';

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
        // Browser/Timer globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        window: 'readonly',
        document: 'readonly',
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
        // Testing library globals
        screen: 'readonly',
        // Cypress globals
        cy: 'readonly',
      },
    },
    plugins: {
      'test-flakiness': testFlakiness,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      // High-risk flaky test patterns - these should always error
      'test-flakiness/no-hard-coded-timeout': 'error',
      'test-flakiness/await-async-events': 'error',
      'test-flakiness/no-immediate-assertions': 'error',
      'test-flakiness/no-unconditional-wait': 'error',
      'test-flakiness/no-promise-race': 'error',
      'test-flakiness/no-test-focus': 'error',
    },
  },
  {
    // Disable each rule only for its own test file to avoid self-referential issues
    files: ['tests/lib/rules/no-hard-coded-timeout.test.js'],
    rules: {
      'test-flakiness/no-hard-coded-timeout': 'off',
    },
  },
  {
    files: ['tests/lib/rules/await-async-events.test.js'],
    rules: {
      'test-flakiness/await-async-events': 'off',
    },
  },
  {
    files: ['tests/lib/rules/no-immediate-assertions.test.js'],
    rules: {
      'test-flakiness/no-immediate-assertions': 'off',
    },
  },
  {
    files: ['tests/lib/rules/no-unconditional-wait.test.js'],
    rules: {
      'test-flakiness/no-unconditional-wait': 'off',
    },
  },
  {
    files: ['tests/lib/rules/no-promise-race.test.js'],
    rules: {
      'test-flakiness/no-promise-race': 'off',
    },
  },
  {
    files: ['tests/lib/rules/no-test-focus.test.js'],
    rules: {
      'test-flakiness/no-test-focus': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js',
      '.husky/**',
      'playground/**',
    ],
  },
];
