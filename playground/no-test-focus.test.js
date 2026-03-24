/**
 * @fileoverview Example file demonstrating no-test-focus rule violations
 * This file shows what the rule detects and prevents
 */

const test = require("node:test");

// ❌ BAD: These will be flagged by the rule

// Focused tests - only these will run
test.only('will run exclusively', () => {
  expect(true).toBe(true);
});

it.only('this test runs alone', () => {
  expect(1).toBe(1);
});

describe.only('focused suite', () => {
  test('nested test 1', () => {
    expect(true).toBe(true);
  });
  test('nested test 2', () => {
    expect(true).toBe(true);
  });
});

// Jasmine/Mocha focused syntax
fit('focused jasmine test', () => {
  expect(true).toBe(true);
});

fdescribe('focused jasmine suite', () => {
  test('inner test', () => {
    expect(true).toBe(true);
  });
});

// Skipped tests - these won't run at all
test.skip('skipped test', () => {
  expect(true).toBe(true);
});

it.skip('not running', () => {
  expect(1).toBe(1);
});

describe.skip('entire suite skipped', () => {
  test('test 1', () => {
    expect(true).toBe(true);
  });
  test('test 2', () => {
    expect(true).toBe(true);
  });
});

// Jasmine/Mocha skip syntax
xit('skipped jasmine test', () => {
  expect(true).toBe(true);
});

xdescribe('skipped jasmine suite', () => {
  test('inner test', () => {
    expect(true).toBe(true);
  });
});

// Todo tests
test.todo('implement this test later');
it.todo('pending implementation');

// ✅ GOOD: These are the correct patterns

// Normal tests that always run

// Mock functions for demonstration
const isValidEmail = (email) => email.includes('@');
const calculateTotal = (numbers) => numbers.reduce((a, b) => a + b, 0);
const createUser = (first, last) => ({ fullName: `${first} ${last}` });
const updateEmail = (user, newEmail) => { user.email = newEmail; };

test('should validate user input', () => {
  const input = 'test@example.com';
  expect(isValidEmail(input)).toBe(true);
});

it('should calculate the total correctly', () => {
  const result = calculateTotal([10, 20, 30]);
  expect(result).toBe(60);
});

describe('UserService', () => {
  test('should create a new user', () => {
    const user = createUser('John', 'Doe');
    expect(user.fullName).toBe('John Doe');
  });

  test('should update user email', () => {
    const user = { email: 'old@example.com' };
    updateEmail(user, 'new@example.com');
    expect(user.email).toBe('new@example.com');
  });
});

// If you need to temporarily disable a test, use comments
// test('temporarily disabled for debugging', () => {
//   // TODO: Fix this test after resolving issue #123
//   expect(brokenFunction()).toBe('fixed');
// });

// Or use conditional logic for environment-specific tests
// Mock process.env and fetchExternalData for demonstration
const processEnv = typeof process !== 'undefined' ? process.env : {};
const fetchExternalData = async () => ({ status: 200 });

if (processEnv.RUN_INTEGRATION_TESTS) {
  test('integration test with external API', async () => {
    const response = await fetchExternalData();
    expect(response.status).toBe(200);
  });
}

// For development, you can use focus temporarily but remove before commit
// During development: test.only('debugging this specific test', ...)
// Before commit: test('debugging this specific test', ...)

/**
 * Configuration examples:
 *
 * Default (strict):
 * "test-flakiness/no-test-focus": "error"
 *
 * Allow skip in development:
 * "test-flakiness/no-test-focus": ["error", { "allowSkip": true }]
 *
 * Allow only in development:
 * "test-flakiness/no-test-focus": ["error", { "allowOnly": true }]
 *
 * Custom patterns:
 * "test-flakiness/no-test-focus": ["error", {
 *   "customFocusPatterns": ["myFocusTest"],
 *   "customSkipPatterns": ["mySkipTest"]
 * }]
 */