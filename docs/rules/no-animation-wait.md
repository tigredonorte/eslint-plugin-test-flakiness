# no-animation-wait

Avoid waiting for animations which can have variable timing.

## Rule Details

Animations and transitions can have unpredictable timing due to various factors:

- System performance variations
- Browser differences
- CSS animation delays
- Device capabilities
- Network conditions affecting resource loading

This rule helps prevent test flakiness by detecting when tests wait for animation-related events.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-animation-wait": [
    "error",
    {
      "allowAnimationFrame": false,
      "allowIfAnimationsDisabled": true,
      "customAnimationPatterns": [],
      "ignorePatterns": []
    }
  ]
}
```

### `allowAnimationFrame` (default: `false`)

When set to `true`, allows the use of `requestAnimationFrame` in tests.

```javascript
// With allowAnimationFrame: true
requestAnimationFrame(callback); // ✅ Allowed

// With allowAnimationFrame: false (default)
requestAnimationFrame(callback); // ❌ Not allowed
```

### `allowIfAnimationsDisabled` (default: `true`)

When set to `true`, animation waits are allowed if the test file appears to have animations disabled.

```javascript
// With allowIfAnimationsDisabled: true (default)
// If the file contains animation-disabling code:
const styles = `* { animation-duration: 0 !important; }`;
waitForAnimation(); // ✅ Allowed

// With allowIfAnimationsDisabled: false
// Same file with animation-disabling code:
waitForAnimation(); // ❌ Still not allowed
```

### `customAnimationPatterns` (default: `[]`)

Array of custom function names to treat as animation waits.

```javascript
// With customAnimationPatterns: ["myCustomWait", "specialAnimationWait"]
myCustomWait(); // ❌ Will be flagged
specialAnimationWait(); // ❌ Will be flagged
```

### `ignorePatterns` (default: `[]`)

Array of regex patterns. Code matching these patterns will not be flagged.

```javascript
// With ignorePatterns: ["legacyAnimation", "allowedWait"]
waitForAnimation(); // ❌ Still flagged
legacyAnimationWait(); // ✅ Ignored if matches pattern
```

## Examples

### ❌ Incorrect

```javascript
// Direct animation wait functions
waitForAnimation();
waitForAnimations();
waitForTransition();
waitForTransitions();
waitForCSSAnimation();
waitForCSSTransition();

// Waiting for animation/transition events
element.waitFor("transitionend");
element.waitFor("animationend");
element.waitFor("transitionstart");
element.waitFor("animationstart");
element.waitFor("transitioncancel");
element.waitFor("animationcancel");

// Vendor-prefixed events
element.waitFor("webkitTransitionEnd");
element.waitFor("webkitAnimationEnd");
element.waitFor("oTransitionEnd");
element.waitFor("msAnimationEnd");

// Request animation frame (without allowAnimationFrame)
requestAnimationFrame(callback);
window.requestAnimationFrame(callback);

// Playwright with animation comments
// Wait for fade animation
page.waitForTimeout(500);

// Cypress animation commands
cy.waitForAnimations();
cy.waitForAnimation();
cy.ensureAnimations();

// Testing Library with animation assertions
waitFor(() => expect(element).toHaveStyle({ opacity: "1" }));
waitFor(() => expect(element).toHaveClass("fade-in"));
waitFor(() => expect(element).toHaveClass("slide-transition"));

// Async waits
await waitForAnimation();
await element.waitFor("transitionend");
```

### ✅ Correct

```javascript
// Wait for specific elements or conditions
await waitFor(() => expect(element).toBeVisible());

// Wait for specific content
await waitFor(() => screen.getByText("Content loaded"));

// Use stable conditions
await waitForElementToBeRemoved(() => screen.queryByText("Loading"));

// Wait for other events
element.waitFor("load");
element.waitFor("click");

// Playwright without animation comments
// Wait for network request
page.waitForTimeout(1000);

// Regular testing assertions
waitFor(() => expect(element).toBeInTheDocument());
waitFor(() => expect(element).toHaveTextContent("Done"));

// Disable animations in test environment instead
// CSS: * { animation-duration: 0s !important; transition-duration: 0s !important; }
```

## Best Practices

### 1. Disable Animations in Tests

The best approach is to disable animations entirely in your test environment:

```css
/* test-styles.css */
*,
*::before,
*::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}
```

Or programmatically:

```javascript
// test-setup.js
beforeAll(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    * {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `;
  document.head.appendChild(style);
});
```

### 2. Use `prefers-reduced-motion`

Configure your animations to respect the reduced motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Then enable it in tests:

```javascript
// In your test setup
Object.defineProperty(window, "matchMedia", {
  value: jest.fn().mockImplementation((query) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});
```

### 3. Wait for Stable Conditions

Instead of waiting for animations, wait for stable conditions:

```javascript
// Instead of: await waitForAnimation()
// Wait for the final state
await waitFor(() => {
  expect(modal).toHaveClass("modal--open");
});

// Instead of: element.waitFor("transitionend")
// Wait for content to appear
await waitFor(() => {
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
```

### 4. Use Testing Library Utilities

React Testing Library and similar tools provide better alternatives:

```javascript
// Wait for element to appear
await screen.findByRole("button", { name: "Submit" });

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText("Loading..."));

// Custom wait conditions
await waitFor(() => {
  expect(element).toHaveAttribute("aria-expanded", "true");
});
```

### 5. Mock Animation APIs

If you must work with animations, consider mocking them:

```javascript
beforeEach(() => {
  // Mock requestAnimationFrame for instant execution
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });

  // Mock CSS transitions/animations to complete instantly
  Element.prototype.addEventListener = jest.fn((event, handler) => {
    if (event === "transitionend" || event === "animationend") {
      setTimeout(handler, 0);
    }
  });
});
```

## Context-Aware Detection

The rule is smart about detecting when animations are disabled. It will not flag animation waits when it detects:

1. CSS that disables animations:
   - `animation-duration: 0`
   - `transition-duration: 0`
   - `animation: none`
   - `transition: none`

2. Test utilities that disable animations:
   - `disableAnimations()`
   - `skipAnimations()`
   - `instantAnimations()`
   - `DISABLE_ANIMATIONS`

3. Reduced motion preferences:
   - `prefersReducedMotion: true`
   - `matchMedia('(prefers-reduced-motion: reduce)')`

This behavior can be controlled with the `allowIfAnimationsDisabled` option.

## When Not To Use It

This rule may not be suitable if:

- You're specifically testing animation behavior
- Your application critically depends on animation timing
- You're using animation libraries that require specific wait patterns
- You're testing CSS animations/transitions themselves

In these cases, you can disable the rule for specific lines:

```javascript
// eslint-disable-next-line test-flakiness/no-animation-wait
await waitForAnimation();
```

Or for entire files:

```javascript
/* eslint-disable test-flakiness/no-animation-wait */
```

Or configure exceptions using the `ignorePatterns` option.

## Further Reading

- [Testing Library - Appearance and Disappearance](https://testing-library.com/docs/guide-disappearance)
- [Kent C. Dodds - Fix the "not wrapped in act(...)" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)
- [CSS-Tricks - Reduced Motion](https://css-tricks.com/introduction-reduced-motion-media-query/)
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Playwright - Disable Animations](https://playwright.dev/docs/api/class-page#page-add-init-script)
