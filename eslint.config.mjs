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
      'test-flakiness/no-hard-coded-timeout': 'error',
    },
  },
  {
    // Disable the no-hard-coded-timeout rule for its own test file
    files: ['tests/lib/rules/no-hard-coded-timeout.test.js'],
    rules: {
      'test-flakiness/no-hard-coded-timeout': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js',
      '.husky/**',
      'examples/**',
    ],
  },
];
