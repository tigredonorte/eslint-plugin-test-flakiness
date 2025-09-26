# ESLint Plugin Test Flakiness - Playground

This playground contains example test files demonstrating common flaky patterns that `eslint-plugin-test-flakiness` detects.

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the linter to see flaky patterns detected:

   ```bash
   npm run lint
   ```

3. Fix auto-fixable issues:

   ```bash
   npm run lint:fix
   ```

## What's Included

### Example Violation Files

Each file demonstrates specific flaky patterns:

- `await-async-events-violations.test.js` - Missing awaits on async operations
- `no-hard-coded-timeout-violations.test.js` - Hard-coded setTimeout delays
- `no-index-queries-violations.test.js` - Index-based DOM queries
- `no-unconditional-wait-violations.test.js` - Fixed delays that don't wait for conditions
- `no-animation-wait-violations.test.js` - Waiting for animations
- `no-global-state-mutation-violations.test.js` - Mutating global state
- And many more...

### Configuration

- `eslint.config.js` - Shows how to configure the plugin with:
  - Using the recommended preset
  - Overriding specific rules
  - Turning off rules when needed
- `package.json` - Minimal setup to run the examples

## Try It Live on StackBlitz

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/tigredonorte/eslint-plugin-test-flakiness/tree/main/playground)

## Learn More

- [Full Documentation](https://github.com/tigredonorte/eslint-plugin-test-flakiness)
- [All Available Rules](https://github.com/tigredonorte/eslint-plugin-test-flakiness#rules)
- [NPM Package](https://www.npmjs.com/package/eslint-plugin-test-flakiness)
