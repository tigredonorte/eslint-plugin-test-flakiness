import testFlakiness from 'eslint-plugin-test-flakiness';

export default [
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    plugins: {
      'test-flakiness': testFlakiness,
    },
    rules: {
      // Using the recommended preset
      ...testFlakiness.configs.recommended.rules,

      // Example: Override a specific rule
      'test-flakiness/no-hard-coded-timeout': ['error', {
        maxTimeout: 100, // Allow timeouts under 100ms
      }],

      // Example: Turn off a specific rule for this project
      'test-flakiness/no-animation-wait': 'off',
    },
  },
];