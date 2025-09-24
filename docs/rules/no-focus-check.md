# no-focus-check

Prevent focus-dependent assertions that can be affected by timing and environment.

## Rule Details

Focus state in browser environments can be unpredictable and timing-dependent:

- Browser focus behavior varies between different browsers
- System-level interruptions can affect focus
- Test runners may run in background tabs or headless mode
- Focus events are asynchronous and can race with test execution
- Screen readers and accessibility tools can interfere with focus state

This rule helps prevent test flakiness by detecting focus-dependent checks that might fail intermittently.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-focus-check": [
    "error",
    {
      "allowWithWaitFor": true
    }
  ]
}
```

### `allowWithWaitFor` (default: `true`)

When set to `true`, allows focus checks when wrapped in `waitFor()` or similar async utilities.

```javascript
// With allowWithWaitFor: true (default)
await waitFor(() => expect(element).toHaveFocus()); // ✅ Allowed

// With allowWithWaitFor: false
await waitFor(() => expect(element).toHaveFocus()); // ❌ Not allowed
```

## Examples

### ❌ Incorrect

```javascript
// Direct focus assertions
expect(element).toHaveFocus();
expect(button).toBeFocused();
expect(input).toHaveFocusedElement();

// Blur checks
expect(element).not.toHaveFocus();
expect(button).not.toBeFocused();

// document.activeElement checks
expect(document.activeElement).toBe(element);
expect(document.activeElement).toEqual(input);

// tabIndex assertions
expect(element.tabIndex).toBe(0);
expect(button.tabIndex).toEqual(-1);

// ARIA focus attributes
expect(element.getAttribute("aria-focused")).toBe("true");
expect(element.hasAttribute("aria-activedescendant")).toBeTruthy();

// Focus method calls followed by immediate assertions
element.focus();
expect(element).toHaveFocus(); // Race condition

// Focus trap testing
createFocusTrap(container);
expect(document.activeElement).toBe(firstElement);

// Cypress focus commands
cy.get("input").focus();
cy.focused().should("have.attr", "id", "username");

// Playwright focus checks
await page.locator("input").focus();
await expect(page.locator("input")).toBeFocused();
```

### ✅ Correct

```javascript
// Use waitFor with focus assertions
await waitFor(() => expect(element).toHaveFocus());
await waitFor(() => expect(button).toBeFocused());

// Wait for other stable conditions instead
await waitFor(() => expect(element).toBeVisible());
await waitFor(() => expect(element).toHaveAttribute("aria-expanded", "true"));

// Use user events that handle focus naturally
await user.click(button);
await user.tab();

// Check for content changes rather than focus
await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

// Use semantic assertions
await waitFor(() => expect(element).toHaveAttribute("aria-selected", "true"));

// Cypress with proper waits
cy.get("input").focus();
cy.get("input").should("be.visible").and("have.value", "expected");

// Playwright with stable conditions
await page.locator("input").click();
await expect(page.locator("input")).toHaveValue("expected");

// Testing focus management through behavior
await user.press("Tab");
await waitFor(() =>
  expect(screen.getByRole("button", { name: "Next" })).toBeVisible(),
);
```

## Best Practices

### 1. Test User Interactions Instead of Focus State

Focus the test on user interactions rather than the internal focus state:

```javascript
// Instead of testing focus directly
element.focus();
expect(element).toHaveFocus();

// Test the user interaction
await user.click(element);
await waitFor(() => {
  expect(screen.getByRole("menu")).toBeVisible();
});
```

### 2. Use waitFor for Any Focus Assertions

When focus testing is necessary, always wrap assertions in waitFor:

```javascript
// Avoid immediate focus checks
expect(element).toHaveFocus(); // ❌

// Use waitFor to handle timing
await waitFor(() => {
  expect(element).toHaveFocus(); // ✅
});
```

### 3. Test Focus Management Through Side Effects

Instead of checking focus directly, test the effects of focus:

```javascript
// Instead of checking activeElement
expect(document.activeElement).toBe(button);

// Test the visible effect of focus
await waitFor(() => {
  expect(button).toHaveClass("focused");
});

// Or test keyboard navigation results
await user.press("Tab");
await waitFor(() => {
  expect(screen.getByRole("menuitem", { name: "File" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
```

### 4. Mock Focus for Consistent Testing

For complex focus scenarios, consider mocking focus behavior:

```javascript
beforeEach(() => {
  // Mock focus/blur to always succeed
  Element.prototype.focus = jest.fn();
  Element.prototype.blur = jest.fn();

  // Mock activeElement to be predictable
  Object.defineProperty(document, "activeElement", {
    get: jest.fn(() => mockActiveElement),
    configurable: true,
  });
});
```

### 5. Disable Focus Management in Tests

Consider disabling focus management entirely in test environments:

```css
/* test-styles.css - Make all elements non-focusable in tests */
* {
  -webkit-user-focus: none !important;
  -moz-user-focus: ignore !important;
}

*[tabindex] {
  tabindex: -1 !important;
}
```

### 6. Test Keyboard Navigation Patterns

Test keyboard navigation through behavior rather than focus:

```javascript
// Instead of checking each focus change
await user.press("Tab");
expect(firstButton).toHaveFocus();
await user.press("Tab");
expect(secondButton).toHaveFocus();

// Test the navigation result
await user.press("Tab");
await user.press("Tab");
await user.press("Enter");
await waitFor(() => {
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
```

## Framework-Specific Examples

### Jest + Testing Library

```javascript
// ❌ Avoid direct focus checks
expect(screen.getByRole("button")).toHaveFocus();

// ✅ Use waitFor
await waitFor(() => {
  expect(screen.getByRole("button")).toHaveFocus();
});

// ✅ Better: test user interaction results
await user.click(screen.getByRole("button"));
await waitFor(() => {
  expect(screen.getByRole("menu")).toBeVisible();
});
```

### Cypress

```javascript
// ❌ Avoid immediate focus assertions
cy.get("input").focus();
cy.focused().should("have.id", "username");

// ✅ Use proper waiting
cy.get("input").focus();
cy.get("input").should("be.visible").and("have.value", "");

// ✅ Test through user behavior
cy.get("input").type("username");
cy.get("input").should("have.value", "username");
```

### Playwright

```javascript
// ❌ Avoid direct focus checks
await page.locator("input").focus();
await expect(page.locator("input")).toBeFocused();

// ✅ Use stable conditions
await page.locator("input").click();
await expect(page.locator("input")).toHaveValue("");

// ✅ Test keyboard navigation results
await page.keyboard.press("Tab");
await expect(page.locator('[role="menuitem"]:first-child')).toHaveClass(
  /active/,
);
```

## When Not To Use It

This rule may not be suitable if:

- You're specifically testing focus management libraries
- Your application has complex focus trap requirements
- You're testing accessibility focus patterns
- You're building focus management utilities

In these cases, you can disable the rule for specific lines:

```javascript
// eslint-disable-next-line test-flakiness/no-focus-check
expect(document.activeElement).toBe(element);
```

Or use the `allowWithWaitFor` option and ensure all focus checks are properly wrapped.

## Related Rules

- [no-immediate-assertions](./no-immediate-assertions.md) - Prevents assertions without proper waiting
- [no-unconditional-wait](./no-unconditional-wait.md) - Encourages conditional waiting over timeouts
- [await-async-events](./await-async-events.md) - Ensures proper handling of async events

## Further Reading

- [Testing Library - Queries](https://testing-library.com/docs/queries/about)
- [ARIA Authoring Practices - Focus Management](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WebAIM - Testing with Screen Readers](https://webaim.org/articles/screenreader_testing/)
- [Playwright - Auto-waiting](https://playwright.dev/docs/actionability)
- [Cypress - Best Practices](https://docs.cypress.io/guides/references/best-practices)
