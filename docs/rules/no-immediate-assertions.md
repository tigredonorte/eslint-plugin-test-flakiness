# no-immediate-assertions

Prevent immediate assertions after async operations without proper waiting.

## Rule Details

Immediate assertions after asynchronous operations are a common source of flaky tests:

- DOM updates happen asynchronously after user interactions
- State changes may not be immediately reflected in the UI
- Network requests complete at unpredictable times
- Component re-renders are asynchronous
- Browser events are processed asynchronously

This rule helps prevent test flakiness by detecting assertions that happen immediately after async operations without proper waiting mechanisms.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-immediate-assertions": [
    "error",
    {
      "allowedAfterOperations": [],
      "requireWaitFor": true,
      "ignoreDataTestId": false
    }
  ]
}
```

### `allowedAfterOperations` (default: `[]`)

Array of operation names that are allowed to be followed by immediate assertions.

```javascript
// With allowedAfterOperations: ["render"]
render(<Component />);
expect(screen.getByText("Hello")).toBeInTheDocument(); // Allowed

// With allowedAfterOperations: []
render(<Component />);
expect(screen.getByText("Hello")).toBeInTheDocument(); // Not allowed
```

### `requireWaitFor` (default: `true`)

When set to `true`, requires `waitFor` for assertions after async operations.

```javascript
// With requireWaitFor: true (default)
await user.click(button);
await waitFor(() => expect(element).toBeVisible()); // Required

// With requireWaitFor: false
await user.click(button);
expect(element).toBeVisible(); // Allowed
```

### `ignoreDataTestId` (default: `false`)

When set to `true`, allows immediate assertions on elements with `data-testid`.

```javascript
// With ignoreDataTestId: true
await user.click(button);
expect(screen.getByTestId("result")).toBeVisible(); // Allowed

// With ignoreDataTestId: false (default)
await user.click(button);
expect(screen.getByTestId("result")).toBeVisible(); // Not allowed
```

## Examples

### Incorrect

```javascript
// User interactions followed by immediate assertions
await user.click(button);
expect(screen.getByText("Success")).toBeInTheDocument();

await user.type(input, "text");
expect(input).toHaveValue("text");

// Form submissions
fireEvent.submit(form);
expect(onSubmit).toHaveBeenCalled();

// State updates
setState(newValue);
expect(component.state.value).toBe(newValue);

// API calls
fetchData();
expect(screen.getByText("Data loaded")).toBeVisible();

// Component interactions
await user.hover(element);
expect(tooltip).toBeVisible();

await user.focus(input);
expect(input).toHaveFocus();

// Playwright immediate assertions
await page.click("button");
await expect(page.locator(".result")).toBeVisible();

// Cypress immediate assertions
cy.click("button");
cy.get(".message").should("be.visible");

// React Testing Library
fireEvent.change(input, { target: { value: "new value" } });
expect(screen.getByDisplayValue("new value")).toBeInTheDocument();

// Mock function calls
mockFunction();
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);

// DOM manipulations
element.classList.add("active");
expect(element).toHaveClass("active");

// Async component updates
component.update();
expect(wrapper.find(".updated")).toHaveLength(1);
```

### Correct

```javascript
// Use waitFor for assertions after user interactions
await user.click(button);
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});

// Wait for form submission effects
fireEvent.submit(form);
await waitFor(() => {
  expect(onSubmit).toHaveBeenCalled();
});

// Wait for state changes to propagate
setState(newValue);
await waitFor(() => {
  expect(screen.getByText(newValue)).toBeInTheDocument();
});

// Use findBy* queries for async content
await user.click(loadButton);
expect(await screen.findByText("Data loaded")).toBeInTheDocument();

// Wait for tooltips and overlays
await user.hover(element);
await waitFor(() => {
  expect(screen.getByRole("tooltip")).toBeVisible();
});

// Playwright with proper waiting
await page.click("button");
await page.waitForSelector(".result");
await expect(page.locator(".result")).toBeVisible();

// Cypress with proper commands
cy.click("button");
cy.get(".message").should("be.visible"); // Cypress automatically retries

// Use Testing Library's async utilities
fireEvent.change(input, { target: { value: "new value" } });
await waitFor(() => {
  expect(screen.getByDisplayValue("new value")).toBeInTheDocument();
});

// Wait for mock calls in async scenarios
triggerAsyncAction();
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
});

// Use immediate assertions only for synchronous operations
const result = syncFunction();
expect(result).toBe(expected);

// Allowed operations (with configuration)
render(<Component />);
expect(screen.getByText("Hello")).toBeInTheDocument(); // If in allowedAfterOperations
```

## Best Practices

### 1. Use waitFor for UI Updates

Always wrap assertions in `waitFor` when testing UI changes:

```javascript
// Instead of immediate assertion
await user.click(toggleButton);
expect(panel).toBeVisible(); // ❌ Race condition

// Use waitFor
await user.click(toggleButton);
await waitFor(() => {
  expect(panel).toBeVisible(); // ✅ Safe
});
```

### 2. Use findBy\* Queries for New Content

Use `findBy*` queries when waiting for new content to appear:

```javascript
// Instead of immediate getBy*
await user.click(loadDataButton);
expect(screen.getByText("Data loaded")).toBeInTheDocument(); // ❌ Flaky

// Use findBy*
await user.click(loadDataButton);
expect(await screen.findByText("Data loaded")).toBeInTheDocument(); // ✅ Safe
```

### 3. Wait for Disappearance

Use `waitForElementToBeRemoved` for content that should disappear:

```javascript
// Instead of immediate assertion
await user.click(closeButton);
expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); // ❌ Flaky

// Wait for removal
await user.click(closeButton);
await waitForElementToBeRemoved(() => screen.queryByRole("dialog")); // ✅ Safe
```

### 4. Handle Form Submissions Properly

Wait for form submission effects:

```javascript
// Instead of immediate check
fireEvent.submit(form);
expect(onSubmit).toHaveBeenCalled(); // ❌ May not be called yet

// Wait for the effect
fireEvent.submit(form);
await waitFor(() => {
  expect(onSubmit).toHaveBeenCalled(); // ✅ Safe
});
```

### 5. Consider Component Update Lifecycle

Account for React's update lifecycle:

```javascript
// Instead of immediate state check
setState(newValue);
expect(component.state).toBe(newValue); // ❌ State may not be updated

// Wait for component to re-render
setState(newValue);
await waitFor(() => {
  expect(screen.getByText(newValue)).toBeInTheDocument(); // ✅ Safe
});
```

### 6. Mock Timers When Testing Time-Based Behavior

Use fake timers for time-based assertions:

```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test("should delay action", () => {
  delayedAction();

  // Fast-forward time instead of waiting
  jest.advanceTimersByTime(1000);

  expect(screen.getByText("Delayed result")).toBeInTheDocument();
});
```

## Framework-Specific Examples

### React Testing Library

```javascript
// ❌ Immediate assertions
fireEvent.change(input, { target: { value: "test" } });
expect(screen.getByDisplayValue("test")).toBeInTheDocument();

// ✅ Proper waiting
fireEvent.change(input, { target: { value: "test" } });
await waitFor(() => {
  expect(screen.getByDisplayValue("test")).toBeInTheDocument();
});

// ✅ Use user events (they have built-in waiting)
await user.type(input, "test");
expect(input).toHaveValue("test"); // User events wait for updates
```

### Jest

```javascript
// ❌ Immediate mock assertions
triggerAsyncCallback();
expect(mockFn).toHaveBeenCalled();

// ✅ Wait for async operations
triggerAsyncCallback();
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});

// ✅ Use flush promises for immediate async
triggerAsyncCallback();
await act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});
expect(mockFn).toHaveBeenCalled();
```

### Cypress

```javascript
// ❌ Avoid immediate custom assertions
cy.click("button");
cy.get("@apiCall").should("have.been.called"); // Custom assertion

// ✅ Use Cypress built-in waiting
cy.click("button");
cy.get(".result").should("be.visible"); // Automatically retries

// ✅ Wait for specific conditions
cy.click("button");
cy.wait("@apiCall");
cy.get(".result").should("contain", "Success");
```

### Playwright

```javascript
// ❌ Immediate assertions
await page.click("button");
await expect(page.locator(".result")).toBeVisible();

// ✅ Use Playwright's auto-waiting
await page.click("button");
await page.waitForSelector(".result");
await expect(page.locator(".result")).toBeVisible();

// ✅ Or use waitFor with conditions
await page.click("button");
await page.waitForFunction(
  () => document.querySelector(".result")?.textContent === "Expected",
);
```

## Common Async Operations That Need Waiting

### User Interactions

- `click()`, `type()`, `hover()`, `focus()`, `blur()`
- Form submissions
- Drag and drop operations

### State Changes

- Component state updates
- Redux/Context state changes
- URL navigation changes

### Network Operations

- API calls
- Resource loading
- WebSocket messages

### DOM Updates

- Element creation/removal
- Class/attribute changes
- Style updates

### Component Lifecycle

- Component mounting/unmounting
- Effect hook execution
- Callback execution

## When Not To Use It

This rule may not be suitable if:

- You're testing purely synchronous operations
- You're using test utilities that handle waiting automatically
- You have custom waiting mechanisms that the rule doesn't recognize

In these cases, you can:

```javascript
// Disable for specific lines
// eslint-disable-next-line test-flakiness/no-immediate-assertions
expect(syncResult).toBe(expected);

// Configure allowed operations
{
  "test-flakiness/no-immediate-assertions": ["error", {
    "allowedAfterOperations": ["render", "syncOperation"]
  }]
}
```

## Related Rules

- [no-unconditional-wait](./no-unconditional-wait.md) - Encourages conditional waiting over timeouts
- [await-async-events](./await-async-events.md) - Ensures proper handling of async events
- [no-animation-wait](./no-animation-wait.md) - Prevents waiting for unpredictable animations

## Further Reading

- [Testing Library - Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async)
- [Kent C. Dodds - Fix the "not wrapped in act(...)" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)
- [Jest - Testing Asynchronous Code](https://jestjs.io/docs/asynchronous)
- [Playwright - Auto-waiting](https://playwright.dev/docs/actionability)
- [Cypress - Retry-ability](https://docs.cypress.io/guides/core-concepts/retry-ability)
