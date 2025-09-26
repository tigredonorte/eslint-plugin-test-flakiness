# Visual Demo: ESLint Plugin Test Flakiness in Action

## 🎬 Live Demo

See the plugin catching flaky patterns in real-time:

### Before: Flaky Test Pattern

```javascript
// ❌ test.spec.js - Multiple violations detected
test("should update user profile", async () => {
  // 🔴 Hard-coded timeout - brittle on slow systems
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 🔴 Missing await on async event
  userEvent.click(submitButton);

  // 🔴 Immediate assertion after state change
  expect(profileName).toBe("John Doe");

  // 🔴 Index-based query - breaks when order changes
  const thirdItem = container.querySelectorAll(".item")[2];
});
```

### ESLint Output

```text
test.spec.js
  3:9  error  Hard-coded timeout detected. Use waitFor() instead    test-flakiness/no-hard-coded-timeout
  6:3  error  Async event userEvent.click must be awaited           test-flakiness/await-async-events
  9:3  error  Assertion immediately after state change              test-flakiness/no-immediate-assertions
  12:20 error  Index-based query is fragile. Use semantic queries    test-flakiness/no-index-queries

✖ 4 problems (4 errors, 0 warnings)
  3 errors potentially fixable with the `--fix` option.
```

### After: Auto-fixed Clean Test

```javascript
// ✅ test.spec.js - All violations fixed!
test("should update user profile", async () => {
  // ✅ Using waitFor pattern
  await waitFor(
    () => {
      expect(profileLoaded).toBe(true);
    },
    { timeout: 2000 },
  );

  // ✅ Properly awaited async event
  await userEvent.click(submitButton);

  // ✅ Wrapped in waitFor for reliable assertion
  await waitFor(() => {
    expect(profileName).toBe("John Doe");
  });

  // ✅ Using semantic query
  const specificItem = screen.getByTestId("item-3");
});
```

## 📊 Expected Impact

Based on common patterns in test suites, implementing this plugin typically helps with:

| Potential Improvement Area     | Expected Impact                                     |
| ------------------------------ | --------------------------------------------------- |
| CI Failures from timing issues | Significant reduction through proper async handling |
| Test retry frequency           | Lower retry counts with deterministic patterns      |
| Debugging time for flaky tests | Faster root cause identification with clear rules   |

_Note: Actual impact will vary based on your codebase and testing patterns. These are illustrative examples of
improvements observed when flaky patterns are addressed._

## 🚀 Try It Yourself

1. **Install the plugin**:

   ```bash
   npm install --save-dev eslint-plugin-test-flakiness
   ```

2. **Run on your test suite**:

   ```bash
   npx eslint '**/*.test.js' --ext .js,.ts --fix
   ```

3. **See immediate improvements** in test reliability!

## 🎯 Common Patterns Caught

The plugin automatically detects and fixes:

- ⏱️ **Timing Issues**: Hard-coded timeouts, missing awaits
- 📍 **Structural Fragility**: Index queries, order dependencies
- 🌐 **State Problems**: Global mutations, missing cleanup
- 🔧 **Network/IO**: Unmocked external calls
- 🎲 **Non-determinism**: Random data, time-based logic

[View Full Documentation →](../README.md)
