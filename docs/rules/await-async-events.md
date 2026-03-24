# Require awaiting async events (await-async-events)

## Rule Details

This rule enforces proper usage of async event utilities and methods by requiring them to be awaited. When async
operations are not awaited, tests may pass even when the async operations fail, leading to false positives and flaky
tests.

### Why is this rule important?

Many testing utilities and browser automation tools provide async methods that return promises. These async operations:

- Properly trigger browser events in the correct sequence
- Allow for proper event propagation and handling
- Ensure that all side effects complete before the test continues
- Accurately simulate real user interactions and browser behavior

When these async utilities are not awaited:

- Tests may complete before the async operations finish
- Errors in async operations may be silently ignored
- Tests become flaky and unreliable
- Race conditions can occur between test assertions and async operations

## Supported Patterns

This rule detects and requires `await` for the following async patterns:

### 1. Testing Library userEvent (v14+)

```javascript
// userEvent methods that must be awaited
(userEvent.click(), userEvent.dblClick(), userEvent.tripleClick());
(userEvent.type(), userEvent.clear(), userEvent.keyboard());
(userEvent.hover(), userEvent.unhover());
(userEvent.selectOptions(), userEvent.deselectOptions());
(userEvent.upload(), userEvent.tab(), userEvent.paste());

// Also supports userEvent.setup() pattern
const user = userEvent.setup();
await user.click(button); // Must be awaited
```

### 2. Testing Library fireEvent

```javascript
// fireEvent methods that should be awaited
(fireEvent.click(), fireEvent.change(), fireEvent.input());
(fireEvent.submit(), fireEvent.focus(), fireEvent.blur());
(fireEvent.keyDown(), fireEvent.keyUp(), fireEvent.keyPress());
(fireEvent.mouseDown(), fireEvent.mouseUp());
```

### 3. React Testing Library act()

```javascript
// act() with async callback must be awaited
await act(async () => {
  await someAsyncOperation();
});
```

### 4. Playwright/Puppeteer Methods

```javascript
// Page methods that must be awaited
(page.click(), page.fill(), page.type(), page.press());
(page.check(), page.uncheck(), page.selectOption());
(page.hover(), page.focus(), page.tap());
(page.goto(), page.reload(), page.waitForSelector());
(page.waitForTimeout(), page.waitForLoadState());
(page.screenshot(), page.setInputFiles());

// Also supports browser, context, and frame objects
(browser.newPage(), context.newPage(), frame.click());
```

### 5. DOM Element Methods

```javascript
// Element methods that should be awaited
(element.click(), element.focus(), element.blur());
(element.submit(), element.type());

// Especially when used with Testing Library queries
screen.getByRole("button").click(); // Must be awaited
getByTestId("submit").click(); // Must be awaited
```

## Examples

### ❌ Incorrect

```javascript
import userEvent from "@testing-library/user-event";
import { fireEvent, act } from "@testing-library/react";

// Missing await on userEvent
test("userEvent example", () => {
  const user = userEvent.setup();
  user.click(button); // ❌ Missing await
  user.type(input, "text"); // ❌ Missing await
});

// Missing await on fireEvent
test("fireEvent example", () => {
  fireEvent.click(button); // ❌ Missing await
  fireEvent.change(input, { target: { value: "test" } }); // ❌ Missing await
});

// Missing await on act with async callback
test("act example", () => {
  act(async () => {
    // ❌ Missing await on act
    await fetchData();
  });
});

// Missing await on Playwright
test("playwright example", async () => {
  page.click("#button"); // ❌ Missing await
  page.fill("#input", "text"); // ❌ Missing await
  page.goto("https://example.com"); // ❌ Missing await
});

// Missing await on element methods
test("element example", () => {
  const button = screen.getByRole("button");
  button.click(); // ❌ Missing await

  inputElement.focus(); // ❌ Missing await
});
```

### ✅ Correct

```javascript
import userEvent from "@testing-library/user-event";
import { fireEvent, act } from "@testing-library/react";

// Properly awaited userEvent
test("userEvent example", async () => {
  const user = userEvent.setup();
  await user.click(button); // ✅ Properly awaited
  await user.type(input, "text"); // ✅ Properly awaited
});

// Properly awaited fireEvent
test("fireEvent example", async () => {
  await fireEvent.click(button); // ✅ Properly awaited
  await fireEvent.change(input, { target: { value: "test" } }); // ✅ Properly awaited
});

// Properly awaited act with async callback
test("act example", async () => {
  await act(async () => {
    // ✅ Properly awaited
    await fetchData();
  });
});

// Properly awaited Playwright
test("playwright example", async () => {
  await page.click("#button"); // ✅ Properly awaited
  await page.fill("#input", "text"); // ✅ Properly awaited
  await page.goto("https://example.com"); // ✅ Properly awaited
});

// Properly awaited element methods
test("element example", async () => {
  const button = screen.getByRole("button");
  await button.click(); // ✅ Properly awaited

  await inputElement.focus(); // ✅ Properly awaited
});
```

## Options

This rule accepts an optional configuration object:

```javascript
{
  "rules": {
    "test-flakiness/await-async-events": ["error", {
      "customAsyncMethods": ["myAsyncHelper", "customEvent"]
    }]
  }
}
```

### `customAsyncMethods` (array)

An array of custom function names that should also be awaited. This is useful when you have custom async utilities
in your test suite.

Example:

```javascript
// With customAsyncMethods: ["myAsyncHelper"]
myAsyncHelper(); // ❌ Will be flagged as missing await
await myAsyncHelper(); // ✅ Correct
```

## When Not To Use It

You should not disable this rule when using Testing Library's user event utilities. The async nature of these
utilities is essential for accurate testing. However, this rule does not apply to:

- Synchronous event utilities (though these are deprecated in newer versions)
- Direct DOM manipulation methods
- Non-Testing Library event handling

## Further Reading

- [Testing Library User Event Documentation](https://testing-library.com/docs/user-event/intro)
- [Common mistakes with Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Why async/await matters in tests](https://testing-library.com/docs/dom-testing-library/api-async)
