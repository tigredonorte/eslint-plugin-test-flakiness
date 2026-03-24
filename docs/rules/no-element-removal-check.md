# no-element-removal-check

Avoid checking for element removal as timing can vary. Element removal checks can lead to flaky tests due to timing
inconsistencies. This rule enforces best practices for handling element removal in tests.

## Rule Details

This rule warns against patterns that check for element removal without proper waiting mechanisms,
which can cause test flakiness due to timing issues.

## Examples

### Invalid

```javascript
// Checking .not.toBeInTheDocument() without waitFor
expect(element).not.toBeInTheDocument();

// Checking for null/undefined/falsy on query methods
expect(queryByText("Loading")).toBeNull();
expect(queryByRole("alert")).toBeUndefined();
expect(queryByTestId("spinner")).toBeFalsy();

// Using !document.contains() pattern
!document.contains(element);
if (!document.contains(modal)) {
  /* ... */
}

// waitForElementToBeRemoved with timeout < 1000ms
await waitForElementToBeRemoved(() => screen.queryByText("Loading"), {
  timeout: 500,
});
```

### Valid

```javascript
// Using waitForElementToBeRemoved
await waitForElementToBeRemoved(() => screen.queryByText("Loading"));
await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"), {
  timeout: 5000,
});

// Wrapping .not.toBeInTheDocument() in waitFor
await waitFor(() => expect(element).not.toBeInTheDocument());
await waitFor(() => {
  expect(screen.queryByText("Loading")).not.toBeInTheDocument();
});

// Positive assertions
expect(element).toBeInTheDocument();
expect(queryByRole("button")).toBeTruthy();

// Using document.contains() positively
document.contains(element);
expect(document.contains(element)).toBe(true);
```

## Why This Rule?

### The Problem

When testing element removal, timing can vary based on:

- Animation durations
- Network response times
- Component re-render cycles
- Browser performance
- System load

Direct checks for element removal without proper waiting can fail intermittently when the removal takes slightly
longer than expected.

### Common Anti-patterns

1. **Direct null/undefined checks on query methods**

   ```javascript
   // Bad - No waiting for removal
   expect(queryByText("Loading")).toBeNull();
   ```

2. **Using .not.toBeInTheDocument() without waiting**

   ```javascript
   // Bad - Checks immediately
   expect(element).not.toBeInTheDocument();
   ```

3. **Document.contains() negation**

   ```javascript
   // Bad - No built-in waiting
   !document.contains(element);
   ```

4. **Insufficient timeout values**

   ```javascript
   // Bad - Timeout too short
   await waitForElementToBeRemoved(() => element, { timeout: 100 });
   ```

### Recommended Patterns

1. **Use waitForElementToBeRemoved**

   ```javascript
   // Good - Properly waits for removal
   await waitForElementToBeRemoved(() => screen.queryByText("Loading"));
   ```

2. **Wrap checks in waitFor**

   ```javascript
   // Good - Retries until condition is met
   await waitFor(() => {
     expect(element).not.toBeInTheDocument();
   });
   ```

3. **Use adequate timeouts**

   ```javascript
   // Good - Sufficient timeout
   await waitForElementToBeRemoved(() => element, { timeout: 5000 });
   ```

4. **Consider positive conditions**

   ```javascript
   // Good - Wait for what appears next
   await waitFor(() => {
     expect(screen.getByText("Content loaded")).toBeInTheDocument();
   });
   ```

## Options

This rule has no configuration options.

## When Not To Use It

You may want to disable this rule if:

- You're testing synchronous operations where timing is guaranteed
- You're using a custom testing framework with different waiting mechanisms
- You have specific test utilities that handle removal checking internally

## Further Reading

- [Testing Library - waitForElementToBeRemoved](https://testing-library.com/docs/dom-testing-library/api-async/#waitforelementtoberemoved)
- [Testing Library - waitFor](https://testing-library.com/docs/dom-testing-library/api-async/#waitfor)
- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
