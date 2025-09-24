# no-unconditional-wait

Prevent unconditional waits (timeouts) that can make tests slow and unreliable.

## Rule Details

Unconditional waits using fixed timeouts are problematic in tests:

- They make tests unnecessarily slow
- They may be too short on slower systems, causing flakiness
- They may be too long on faster systems, wasting time
- They don't adapt to actual conditions
- They can mask real timing issues

This rule helps prevent test flakiness by detecting unconditional waits and encouraging conditional waiting patterns.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-unconditional-wait": [
    "error",
    {
      "maxTimeout": 1000,
      "allowInSetup": true,
      "allowedMethods": []
    }
  ]
}
```

### `maxTimeout` (default: `1000`)

Maximum allowed timeout duration in milliseconds.

```javascript
// With maxTimeout: 1000 (default)
setTimeout(() => {}, 500); // ✅ Allowed
setTimeout(() => {}, 2000); // ❌ Too long

// With maxTimeout: 2000
setTimeout(() => {}, 1500); // ✅ Allowed
```

### `allowInSetup` (default: `true`)

When set to `true`, allows unconditional waits in setup/teardown hooks.

```javascript
// With allowInSetup: true (default)
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // ✅ Allowed
});

// With allowInSetup: false
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // ❌ Not allowed
});
```

### `allowedMethods` (default: `[]`)

Array of method names that are allowed to use unconditional waits.

```javascript
// With allowedMethods: ["debounceWait"]
await debounceWait(500); // ✅ Allowed

// With allowedMethods: []
await debounceWait(500); // ❌ Not allowed if it uses setTimeout
```

## Examples

### ❌ Incorrect

```javascript
// setTimeout and setInterval
setTimeout(() => {
  expect(element).toBeVisible();
}, 1000);

await new Promise((resolve) => setTimeout(resolve, 2000));

// Page/browser waits
await page.waitForTimeout(3000);
await browser.pause(1500);

// Cypress waits
cy.wait(2000);
cy.get("button").wait(1000).click();

// Sleep functions
await sleep(1000);
await delay(2000);

// Manual promise delays
await new Promise((resolve) => {
  setTimeout(resolve, 1000);
});

// Testing Library with fixed timeout
await waitFor(
  () => {
    expect(element).toBeVisible();
  },
  { timeout: 5000 },
); // Large timeout without condition

// Playwright with long waits
await page.waitForLoadState("networkidle", { timeout: 10000 });

// Jest fake timers with long advances
jest.advanceTimersByTime(5000);

// Custom wait functions
function waitForSeconds(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
await waitForSeconds(3);

// Polling with fixed intervals
while (true) {
  if (condition()) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Animation waits
await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for animation
```

### ✅ Correct

```javascript
// Use conditional waiting
await waitFor(() => {
  expect(element).toBeVisible();
});

// Wait for specific conditions
await waitForElementToBeRemoved(() => screen.queryByText("Loading..."));

// Use proper async utilities
const result = await screen.findByRole("button");

// Page waits for specific conditions
await page.waitForSelector(".loaded");
await page.waitForLoadState("networkidle");

// Cypress conditional waits
cy.get('[data-cy="loading"]').should("not.exist");
cy.get('[data-cy="content"]').should("be.visible");

// Wait for network requests
cy.intercept("GET", "/api/data").as("getData");
cy.wait("@getData");

// Use event-based waiting
await new Promise((resolve) => {
  element.addEventListener("transitionend", resolve, { once: true });
});

// Testing Library with reasonable timeouts and conditions
await waitFor(
  () => {
    expect(element).toHaveClass("loaded");
  },
  { timeout: 2000, interval: 50 },
);

// Playwright with specific conditions
await page.waitForFunction(() => {
  return document.querySelector(".spinner") === null;
});

// Jest fake timers with specific advances
jest.advanceTimersToNextTimer();
jest.runOnlyPendingTimers();

// Custom conditional wait functions
async function waitForCondition(condition, timeout = 2000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Condition not met");
}

// Efficient polling with early exit
const result = await waitForCondition(async () => {
  const element = document.querySelector(".target");
  return element && element.textContent === "Ready";
});

// Use AbortController for cancellable operations
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  await fetch("/api/data", { signal: controller.signal });
} catch (error) {
  if (error.name === "AbortError") {
    // Handle timeout
  }
}
```

## Best Practices

### 1. Use Conditional Waiting

Replace fixed timeouts with condition-based waiting:

```javascript
// Instead of fixed timeout
await new Promise((resolve) => setTimeout(resolve, 1000));
expect(element).toBeVisible();

// Use conditional waiting
await waitFor(() => {
  expect(element).toBeVisible();
});
```

### 2. Wait for Specific Events

Wait for meaningful events rather than arbitrary time:

```javascript
// Instead of timeout
setTimeout(() => {
  expect(animation).toHaveClass("completed");
}, 500);

// Wait for animation event
await new Promise((resolve) => {
  element.addEventListener("animationend", resolve, { once: true });
});
expect(element).toHaveClass("completed");
```

### 3. Use Framework Utilities

Leverage built-in waiting utilities:

```javascript
// Instead of manual timeout
await new Promise((resolve) => setTimeout(resolve, 1000));
const button = document.querySelector("button");

// Use Testing Library
const button = await screen.findByRole("button");

// Use Cypress built-in waiting
cy.get("button").should("be.visible");

// Use Playwright auto-waiting
await page.click("button");
```

### 4. Implement Smart Polling

Create efficient polling mechanisms:

```javascript
// Instead of fixed interval polling
while (true) {
  if (condition()) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Smart polling with exponential backoff
async function pollWithBackoff(condition, maxWait = 5000) {
  let delay = 10;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 500); // Cap at 500ms
  }

  throw new Error("Polling timeout");
}
```

### 5. Use Proper Timeouts

When timeouts are necessary, make them reasonable:

```javascript
// Instead of very long timeouts
await waitFor(
  () => {
    expect(element).toBeVisible();
  },
  { timeout: 10000 },
);

// Use reasonable timeouts with clear purpose
await waitFor(
  () => {
    expect(element).toBeVisible();
  },
  {
    timeout: 2000, // Reasonable for UI updates
    interval: 50, // Fast polling
  },
);
```

### 6. Handle Different Environments

Make timeouts environment-aware:

```javascript
// Instead of fixed timeout
const TIMEOUT = 5000;

// Environment-aware timeout
const TIMEOUT = process.env.CI ? 10000 : 2000;

// Or use adaptive timeouts
const getTimeout = () => {
  if (process.env.CI) return 5000;
  if (process.env.NODE_ENV === "development") return 1000;
  return 2000;
};
```

## Framework-Specific Examples

### React Testing Library

```javascript
// ❌ Fixed timeout
setTimeout(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
}, 1000);

// ✅ Conditional waiting
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// ✅ findBy queries
const element = await screen.findByText("Loaded");
```

### Cypress

```javascript
// ❌ Fixed wait
cy.wait(2000);
cy.get(".content").should("be.visible");

// ✅ Conditional waiting
cy.get(".loading").should("not.exist");
cy.get(".content").should("be.visible");

// ✅ Network waiting
cy.intercept("GET", "/api/data").as("loadData");
cy.wait("@loadData");
```

### Playwright

```javascript
// ❌ Fixed timeout
await page.waitForTimeout(3000);
await expect(page.locator(".modal")).toBeVisible();

// ✅ Conditional waiting
await page.waitForSelector(".modal");
await expect(page.locator(".modal")).toBeVisible();

// ✅ Wait for specific state
await page.waitForLoadState("networkidle");
```

### Jest

```javascript
// ❌ Large timer advances
jest.advanceTimersByTime(10000);

// ✅ Advance to next timer
jest.advanceTimersToNextTimer();
jest.runOnlyPendingTimers();

// ✅ Flush all timers
jest.runAllTimers();
```

## Common Timeout Anti-patterns

### Magic Numbers

```javascript
// ❌ Unexplained timeout
await new Promise((resolve) => setTimeout(resolve, 1337));

// ✅ Named constant with explanation
const DEBOUNCE_DELAY = 300; // Wait for user to stop typing
await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_DELAY));
```

### Excessive Timeouts

```javascript
// ❌ Way too long
cy.get(".button", { timeout: 30000 }).click();

// ✅ Reasonable timeout
cy.get(".button", { timeout: 5000 }).click();
```

### No Timeout Strategy

```javascript
// ❌ No clear reason for wait
await page.waitForTimeout(2000);
await page.click("button");

// ✅ Wait for specific condition
await page.waitForSelector("button:not(:disabled)");
await page.click("button");
```

## When Not To Use It

This rule may not be suitable if:

- You're testing timing-dependent behavior specifically
- You need to wait for external systems with known delays
- You're working with animations that have fixed durations
- You're testing debounced or throttled functionality

In these cases:

```javascript
// Disable for legitimate timing tests
// eslint-disable-next-line test-flakiness/no-unconditional-wait
await new Promise(resolve => setTimeout(resolve, 1000));

// Or configure higher timeout limits
{
  "test-flakiness/no-unconditional-wait": ["error", {
    "maxTimeout": 5000,
    "allowInSetup": true
  }]
}
```

## Related Rules

- [no-immediate-assertions](./no-immediate-assertions.md) - Requires proper waiting before assertions
- [no-animation-wait](./no-animation-wait.md) - Prevents animation-specific waits
- [await-async-events](./await-async-events.md) - Ensures proper async handling

## Further Reading

- [Testing Library - Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async)
- [Cypress - Best Practices](https://docs.cypress.io/guides/references/best-practices#Unnecessary-Waiting)
- [Playwright - Auto-waiting](https://playwright.dev/docs/actionability)
- [Jest - Timer Mocks](https://jestjs.io/docs/timer-mocks)
- [Effective Test Waiting Strategies](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)
