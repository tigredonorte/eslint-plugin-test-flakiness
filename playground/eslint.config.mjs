import js from '@eslint/js';
import testFlakiness from '../lib/index.js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    plugins: {
      'test-flakiness': testFlakiness,
    },
    languageOptions: {
      globals: {
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
        // Browser globals
        document: 'readonly',
        window: 'readonly',
        XPathResult: 'readonly',
        // Cypress globals
        cy: 'readonly',
        // Playwright globals
        page: 'readonly',
        // jQuery global
        $: 'readonly',
        // Node.js globals
        setTimeout: 'readonly',
        global: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        // Jasmine/Mocha globals
        fit: 'readonly',
        fdescribe: 'readonly',
        xit: 'readonly',
        xdescribe: 'readonly',
      },
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
];