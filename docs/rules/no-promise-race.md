# no-promise-race

Prevent Promise.race() usage in tests which can create non-deterministic behavior.

## Rule Details

`Promise.race()` creates inherent non-determinism in tests:

- The fastest promise wins, creating unpredictable outcomes
- Network timing variations can change which promise resolves first
- System performance affects promise resolution order
- Different environments may have different race outcomes
- Timeouts and actual operations may race unpredictably

This rule helps prevent test flakiness by detecting `Promise.race()` usage that can lead to non-deterministic test behavior.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-promise-race": [
    "error",
    {
      "allowWithTimeout": false,
      "allowInHelpers": true
    }
  ]
}
```

### `allowWithTimeout` (default: `false`)

When set to `true`, allows `Promise.race()` when used with timeout patterns.

```javascript
// With allowWithTimeout: true
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 5000),
  ),
]); // ✅ Allowed

// With allowWithTimeout: false (default)
const result = await Promise.race([fetchData(), timeout(5000)]); // ❌ Not allowed
```

### `allowInHelpers` (default: `true`)

When set to `true`, allows `Promise.race()` in test helper functions and utilities.

```javascript
// With allowInHelpers: true (default)
function createTimeoutHelper() {
  return Promise.race([operation(), timeout()]); // ✅ Allowed in helper
}

// With allowInHelpers: false
function createTimeoutHelper() {
  return Promise.race([operation(), timeout()]); // ❌ Not allowed
}
```

## Examples

### ❌ Incorrect

```javascript
// Basic Promise.race usage
const result = await Promise.race([fetch("/api/data"), fetch("/api/backup")]);

// Racing with timeout
const data = await Promise.race([
  apiCall(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 1000),
  ),
]);

// Racing multiple async operations
const winner = await Promise.race([
  database.findUser(id),
  cache.getUser(id),
  external.fetchUser(id),
]);

// Racing in test setup
beforeEach(async () => {
  const config = await Promise.race([loadConfig(), getDefaultConfig()]);
});

// Racing user interactions
const interaction = await Promise.race([
  waitForClick(),
  waitForKeypress(),
  waitForTouch(),
]);

// Racing with animations
const completed = await Promise.race([
  waitForAnimation(),
  waitForTimeout(1000),
]);

// Cypress Promise.race
cy.wrap(
  Promise.race([
    cy.get('[data-cy="option1"]').click(),
    cy.get('[data-cy="option2"]').click(),
  ]),
);

// Racing network calls
const response = await Promise.race([
  httpClient.get("/primary"),
  httpClient.get("/fallback"),
]);

// Racing file operations
const content = await Promise.race([
  fs.readFile("file1.txt"),
  fs.readFile("file2.txt"),
]);
```

### ✅ Correct

```javascript
// Use explicit timeout handling
try {
  const result = await Promise.all([fetch("/api/data"), fetch("/api/backup")]);
} catch (error) {
  // Handle specific failures
}

// Use proper timeout utilities
const data = await withTimeout(apiCall(), 1000);

// Sequential operations with fallback
let user;
try {
  user = await database.findUser(id);
} catch {
  user = await cache.getUser(id);
}

// Use waitFor with proper conditions
await waitFor(
  () => {
    return element.textContent === "Expected";
  },
  { timeout: 5000 },
);

// Handle multiple events sequentially
const handleClick = () => {
  /* handler */
};
const handleKeypress = () => {
  /* handler */
};

element.addEventListener("click", handleClick);
element.addEventListener("keypress", handleKeypress);

// Use animation utilities that don't race
await waitForAnimationComplete(element);

// Use Cypress commands that handle timing
cy.get('[data-cy="button"]').click();
cy.get('[data-cy="result"]').should("be.visible");

// Handle network calls with proper error handling
let response;
try {
  response = await httpClient.get("/primary");
} catch (error) {
  response = await httpClient.get("/fallback");
}

// Sequential file operations
let content;
try {
  content = await fs.readFile("file1.txt");
} catch (error) {
  content = await fs.readFile("file2.txt");
}

// Use Promise.all for parallel operations when all needed
const [data, metadata] = await Promise.all([
  fetch("/api/data"),
  fetch("/api/metadata"),
]);

// Use proper async/await patterns
async function loadDataWithFallback() {
  try {
    return await primarySource();
  } catch {
    return await fallbackSource();
  }
}
```

## Best Practices

### 1. Use Explicit Timeout Handling

Instead of racing with timeouts, use explicit timeout utilities:

```javascript
// Instead of Promise.race with timeout
const result = await Promise.race([
  operation(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 5000),
  ),
]);

// Use explicit timeout handling
const result = await withTimeout(operation(), 5000);

// Or use AbortController
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
const result = await operation({ signal: controller.signal });
```

### 2. Handle Fallbacks Sequentially

Use try-catch for fallback patterns instead of racing:

```javascript
// Instead of racing sources
const data = await Promise.race([primaryAPI(), secondaryAPI(), cacheAPI()]);

// Use sequential fallback
async function loadData() {
  try {
    return await primaryAPI();
  } catch (primaryError) {
    try {
      return await secondaryAPI();
    } catch (secondaryError) {
      return await cacheAPI();
    }
  }
}
```

### 3. Use waitFor for Conditional Waiting

Instead of racing conditions, use proper conditional waiting:

```javascript
// Instead of racing for UI state
const state = await Promise.race([
  waitForElement(),
  waitForError(),
  waitForLoading(),
]);

// Use waitFor with conditions
await waitFor(() => {
  return (
    screen.getByRole("button") ||
    screen.getByRole("alert") ||
    screen.getByRole("progressbar")
  );
});
```

### 4. Handle Multiple Events Properly

Use event listeners instead of racing for events:

```javascript
// Instead of racing events
const event = await Promise.race([waitForClick(), waitForKeypress()]);

// Use proper event handling
return new Promise((resolve) => {
  const handleClick = () => {
    element.removeEventListener("keypress", handleKeypress);
    resolve("click");
  };
  const handleKeypress = () => {
    element.removeEventListener("click", handleClick);
    resolve("keypress");
  };

  element.addEventListener("click", handleClick, { once: true });
  element.addEventListener("keypress", handleKeypress, { once: true });
});
```

### 5. Use Framework-Specific Utilities

Leverage framework utilities that handle timing properly:

```javascript
// Instead of custom racing
const result = await Promise.race([waitForElement(), timeout(5000)]);

// Use framework utilities
// Testing Library
await waitFor(() => screen.getByRole("button"), { timeout: 5000 });

// Cypress (built-in retry logic)
cy.get('[data-cy="button"]', { timeout: 5000 }).should("exist");

// Playwright (built-in waiting)
await page.waitForSelector("button", { timeout: 5000 });
```

### 6. Create Deterministic Test Helpers

Build test utilities that avoid racing:

```javascript
// Instead of racing helper
function waitForAnyCondition(conditions) {
  return Promise.race(conditions.map((c) => waitFor(c)));
}

// Create deterministic helpers
async function waitForConditions(conditions) {
  for (const condition of conditions) {
    try {
      return await waitFor(condition, { timeout: 1000 });
    } catch {
      continue;
    }
  }
  throw new Error("No conditions met");
}
```

## Framework-Specific Examples

### Jest + Testing Library

```javascript
// ❌ Racing for elements
const element = await Promise.race([
  waitFor(() => screen.getByRole("button")),
  waitFor(() => screen.getByRole("link")),
]);

// ✅ Use proper conditional waiting
await waitFor(() => {
  return screen.queryByRole("button") || screen.queryByRole("link");
});
```

### Cypress

```javascript
// ❌ Racing Cypress commands
cy.wrap(
  Promise.race([
    cy.get('[data-cy="submit"]').then(() => "submit"),
    cy.get('[data-cy="cancel"]').then(() => "cancel"),
  ]),
);

// ✅ Use Cypress conditional logic
cy.get("body").then(($body) => {
  if ($body.find('[data-cy="submit"]').length) {
    cy.get('[data-cy="submit"]').click();
  } else {
    cy.get('[data-cy="cancel"]').click();
  }
});
```

### Playwright

```javascript
// ❌ Racing for elements
const winner = await Promise.race([
  page.waitForSelector(".success"),
  page.waitForSelector(".error"),
]);

// ✅ Use Playwright's race alternative
await page.waitForSelector(".success, .error");

// Or use conditional waiting
try {
  await page.waitForSelector(".success", { timeout: 2000 });
} catch {
  await page.waitForSelector(".error");
}
```

## Common Racing Anti-patterns

### Network Request Racing

```javascript
// ❌ Racing requests
const data = await Promise.race([primaryAPI(), fallbackAPI()]);

// ✅ Sequential with fallback
const data = await loadWithFallback(primaryAPI, fallbackAPI);
```

### Event Racing

```javascript
// ❌ Racing events
const event = await Promise.race([waitForClick(), waitForSubmit()]);

// ✅ Proper event handling
await waitForAnyEvent(["click", "submit"], element);
```

### Timeout Racing

```javascript
// ❌ Racing with timeout
const result = await Promise.race([operation(), timeout(5000)]);

// ✅ Built-in timeout
const result = await operation({ timeout: 5000 });
```

## When Not To Use It

This rule may not be suitable if:

- You're testing race condition handling specifically
- You're building utilities that legitimately need racing behavior
- You're working with APIs that require racing for performance

In these cases:

```javascript
// Disable for legitimate race condition tests
// eslint-disable-next-line test-flakiness/no-promise-race
const raceResult = await Promise.race([op1(), op2()]);

// Or configure to allow in helpers
{
  "test-flakiness/no-promise-race": ["error", {
    "allowInHelpers": true
  }]
}
```

## Related Rules

- [no-unconditional-wait](./no-unconditional-wait.md) - Encourages conditional waiting
- [no-immediate-assertions](./no-immediate-assertions.md) - Prevents timing-dependent assertions
- [await-async-events](./await-async-events.md) - Ensures proper async handling

## Further Reading

- [Promise.race() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
- [Testing Async Code - Jest](https://jestjs.io/docs/asynchronous)
- [AbortController - Canceling Async Operations](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Playwright - Waiting for Elements](https://playwright.dev/docs/actionability)
- [Testing Library - Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async)
