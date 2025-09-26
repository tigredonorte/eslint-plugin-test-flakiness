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
      'test-flakiness': testFlakiness
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    plugins: {
      'test-flakiness': testFlakiness,
    },
    rules: {
      // Using the recommended preset
      ...testFlakiness.configs.all.rules,

      // Example: Override a specific rule
      // 'test-flakiness/no-hard-coded-timeout': ['error', {
      //   maxTimeout: 100, // Allow timeouts under 100ms
      // }],
    },
  },
  {
    // Disable each rule only for its own test file to avoid self-referential issues
    files: ['tests/lib/rules/no-hard-coded-timeout.test.js'],
    rules: {
      'test-flakiness/no-hard-coded-timeout': 'off',
      'test-flakiness/no-test-isolation': 'off',
    },
  },
  {
    files: ['tests/lib/rules/await-async-events.test.js'],
    rules: {
      'test-flakiness/await-async-events': 'off',
      'test-flakiness/no-test-isolation': 'off',
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
    files: ['tests/lib/rules/no-index-queries.test.js'],
    rules: {
      'test-flakiness/no-index-queries': 'off',
    },
  },
  {
    files: ['tests/lib/rules/no-animation-wait.test.js'],
    rules: {
      'test-flakiness/no-animation-wait': 'off',
      'test-flakiness/no-test-isolation': 'off',
    },
  },
  {
    files: ['tests/lib/rules/no-database-operations.test.js'],
    rules: {
      'test-flakiness/no-database-operations': 'off',
      'test-flakiness/no-test-isolation': 'off',
    },
  },
  {
    files: ['tests/lib/rules/no-element-removal-check.test.js'],
    rules: {
      'test-flakiness/no-element-removal-check': 'off',
      'test-flakiness/no-test-isolation': 'off',
    },
  },
  {
    // Disable cross-cutting rules for plugin infrastructure test files
    files: ['tests/lib/index.test.js'],
    rules: {
      'test-flakiness/no-test-isolation': 'off',
    },
  },
  {
    files: ['tests/lib/fixer-integration.test.js'],
    rules: {
      'test-flakiness/no-test-isolation': 'off',
      'test-flakiness/no-global-state-mutation': 'off',
    },
  },
  {
    files: ['tests/lib/utils/helpers.test.js'],
    rules: {
      'test-flakiness/no-test-isolation': 'off',
      'test-flakiness/no-global-state-mutation': 'off',
    },
  },
  {
    files: ['tests/lib/utils/test-helpers.test.js'],
    rules: {
      'test-flakiness/no-test-isolation': 'off',
      'test-flakiness/no-random-data': 'off',
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
