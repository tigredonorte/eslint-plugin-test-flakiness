/**
 * @fileoverview Example file demonstrating no-test-focus rule violations
 * This file shows what the rule detects and prevents
 */

// ❌ BAD: These will be flagged by the rule

// Focused tests - only these will run
test.only('will run exclusively', () => {
  expect(true).toBe(true);
});

it.only('this test runs alone', () => {
  // Other tests won't run
});

describe.only('focused suite', () => {
  test('nested test 1', () => {});
  test('nested test 2', () => {});
  // Only tests in this suite will run
});

// Jasmine/Mocha focused syntax
fit('focused jasmine test', () => {
  // This is a focused test
});

fdescribe('focused jasmine suite', () => {
  // All tests here run exclusively
});

// Skipped tests - these won't run at all
test.skip('skipped test', () => {
  // This test is skipped
});

it.skip('not running', () => {
  // This won't execute
});

describe.skip('entire suite skipped', () => {
  test('test 1', () => {});
  test('test 2', () => {});
  // None of these tests will run
});

// Jasmine/Mocha skip syntax
xit('skipped jasmine test', () => {
  // This test won't run
});

xdescribe('skipped jasmine suite', () => {
  // No tests here will run
});

// Todo tests
test.todo('implement this test later');
it.todo('pending implementation');

// ✅ GOOD: These are the correct patterns

// Normal tests that always run
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
if (process.env.RUN_INTEGRATION_TESTS) {
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