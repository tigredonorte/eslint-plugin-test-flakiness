# no-hard-coded-timeout

Disallow hard-coded timeouts in tests

## Rule Details

This rule helps prevent test flakiness by discouraging the use of hard-coded timeouts in test files. Hard-coded
timeouts can make tests brittle and unpredictable across different environments and system conditions.

The rule detects and reports:

- `setTimeout()` calls with fixed delays
- `setInterval()` usage in tests
- Promise-based timeout patterns
- Cypress `cy.wait()` with numeric delays
- Common wait/delay/sleep helper functions

### Examples of **incorrect** code

```javascript
// setTimeout with hard-coded delay
setTimeout(() => {
  expect(element).toBeVisible();
}, 2000);

// setInterval in tests
setInterval(() => {
  checkStatus();
}, 1000);

// Promise-based timeouts
await new Promise((resolve) => setTimeout(resolve, 3000));

// Cypress fixed waits
cy.wait(5000);

// Custom wait helpers
await wait(2000);
await delay(1500);
```

### Examples of **correct** code

```javascript
// Use waitFor utilities
await waitFor(
  () => {
    expect(element).toBeVisible();
  },
  { timeout: 2000 },
);

// Use polling with waitFor
await waitFor(() => {
  return checkStatus();
});

// Use Cypress aliases
cy.intercept("GET", "/api/data").as("getData");
cy.wait("@getData");

// Mock timers
jest.setTimeout(10000);
vi.setTimeout(10000);
```

## Options

This rule accepts an options object with the following properties:

### `maxTimeout`

- Type: `number`
- Default: `1000`

The maximum timeout value (in milliseconds) allowed before the rule reports an issue. Timeouts below this threshold
won't be reported.

```json
{
  "rules": {
    "test-flakiness/no-hard-coded-timeout": ["error", { "maxTimeout": 500 }]
  }
}
```

### `allowInSetup`

- Type: `boolean`
- Default: `false`

When set to `true`, allows hard-coded timeouts in setup and teardown hooks (`before`, `after`, `beforeEach`,
`afterEach`, `beforeAll`, `afterAll`).

```json
{
  "rules": {
    "test-flakiness/no-hard-coded-timeout": ["error", { "allowInSetup": true }]
  }
}
```

## When Not To Use It

This rule may not be suitable if:

- Your test suite requires specific timing for integration tests
- You're testing timeout behavior itself
- You're working with legacy code that heavily relies on timeouts

## Automatic Fixes

This rule provides automatic fixes for some patterns:

- `setTimeout` calls are converted to `waitFor` patterns
- Promise-based timeouts are converted to `waitFor` utilities

Note: Automatic fixes should be reviewed as they may require additional imports or setup depending on your testing framework.

## Related Rules

- [no-promise-wait](./no-promise-wait.md)
- [no-cy-wait](./no-cy-wait.md)

## Further Reading

- [Testing Library - waitFor](https://testing-library.com/docs/dom-testing-library/api-async/#waitfor)
- [Cypress - Network Requests](https://docs.cypress.io/guides/guides/network-requests)
- [Jest - Timer Mocks](https://jestjs.io/docs/timer-mocks)
