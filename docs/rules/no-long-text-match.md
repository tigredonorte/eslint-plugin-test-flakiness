# no-long-text-match

Prevent exact matches on long text that may change due to localization, spacing, or content updates.

## Rule Details

Exact text matching on long strings is brittle and can lead to flaky tests:

- Content may change due to copywriting updates
- Localization can alter text length and structure
- Dynamic content may include variable parts (dates, names, numbers)
- Whitespace handling can be inconsistent across browsers
- Text wrapping and formatting can affect rendered content

This rule helps prevent test flakiness by detecting overly specific text matching that could break with minor content changes.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-long-text-match": [
    "error",
    {
      "maxLength": 50,
      "allowPartialMatch": true,
      "ignoreTestIds": false
    }
  ]
}
```

### `maxLength` (default: `50`)

Maximum allowed length for exact text matching.

```javascript
// With maxLength: 30
expect(screen.getByText("Click here")).toBeInTheDocument(); // ✅ Allowed (10 chars)
expect(
  screen.getByText("This is a very long text that might change"),
).toBeInTheDocument(); // ❌ Not allowed (43 chars)

// With maxLength: 50
expect(screen.getByText("This is a moderately long text")).toBeInTheDocument(); // ✅ Allowed (31 chars)
```

### `allowPartialMatch` (default: `true`)

When set to `true`, allows partial text matching with regex or substring queries.

```javascript
// With allowPartialMatch: true (default)
expect(screen.getByText(/Click here/)).toBeInTheDocument(); // ✅ Allowed
expect(screen.getByText("Long text", { exact: false })).toBeInTheDocument(); // ✅ Allowed

// With allowPartialMatch: false
expect(screen.getByText(/Click here/)).toBeInTheDocument(); // ❌ Not allowed
```

### `ignoreTestIds` (default: `false`)

When set to `true`, ignores text matching when using `data-testid` attributes.

```javascript
// With ignoreTestIds: true
expect(screen.getByTestId("long-text-element")).toHaveTextContent(
  "Very long text",
); // ✅ Allowed

// With ignoreTestIds: false (default)
expect(screen.getByTestId("element")).toHaveTextContent("Very long text"); // ❌ Not allowed
```

## Examples

### ❌ Incorrect

```javascript
// Long exact text matches
expect(
  screen.getByText(
    "Welcome to our amazing application! Please click the button below to get started.",
  ),
).toBeInTheDocument();

expect(
  screen.getByText(
    "Error: The username you entered is already taken. Please try a different username.",
  ),
).toBeVisible();

// Long text in assertions
expect(element).toHaveTextContent(
  "This is a very long paragraph that contains multiple sentences and might change over time due to content updates or localization.",
);

// Cypress long text matches
cy.contains(
  "Your account has been successfully created and you will receive a confirmation email shortly.",
).should("be.visible");

// Playwright long text
await expect(
  page.getByText(
    "Welcome to the dashboard! Here you can manage your account settings and view your recent activity.",
  ),
).toBeVisible();

// Multi-line text matching
expect(
  screen.getByText(`
  Line 1: This is the first line of text
  Line 2: This is the second line with more content
  Line 3: Final line with additional information
`),
).toBeInTheDocument();

// Dynamic content with exact match
expect(
  screen.getByText(
    `Hello John Doe, your order #12345 has been processed and will be delivered on January 15, 2024.`,
  ),
).toBeVisible();

// Error message exact matches
expect(
  screen.getByText(
    "Validation failed: Email address is required, password must be at least 8 characters long, and terms must be accepted.",
  ),
).toBeInTheDocument();
```

### ✅ Correct

```javascript
// Use partial text matching
expect(
  screen.getByText(/Welcome to our amazing application/),
).toBeInTheDocument();
expect(screen.getByText("Welcome", { exact: false })).toBeInTheDocument();

// Use more specific selectors
expect(screen.getByRole("alert")).toHaveTextContent(/username.*already taken/i);

// Break down long text into key parts
expect(screen.getByText(/account.*successfully created/i)).toBeVisible();
expect(screen.getByText(/confirmation email/i)).toBeVisible();

// Use ARIA labels or roles
expect(screen.getByRole("heading", { name: /dashboard/i })).toBeVisible();
expect(screen.getByLabelText(/account settings/i)).toBeInTheDocument();

// Test by key phrases
expect(screen.getByText(/order.*processed/)).toBeVisible();
expect(screen.getByText(/delivered on/)).toBeVisible();

// Use data attributes for complex content
<div data-testid="welcome-message">Long welcome text...</div>;
expect(screen.getByTestId("welcome-message")).toBeInTheDocument();

// Focus on semantic meaning
expect(screen.getByRole("status")).toHaveTextContent(/validation failed/i);
expect(screen.getByRole("status")).toHaveTextContent(/email.*required/i);

// Cypress partial matching
cy.contains("account.*created").should("be.visible");
cy.get('[data-cy="success-message"]').should("contain", "successfully");

// Playwright partial matching
await expect(page.locator('[data-testid="welcome"]')).toContainText("Welcome");
await expect(page.getByRole("alert")).toContainText(/error.*username/i);

// Test structure rather than exact content
const paragraph = screen.getByTestId("description");
expect(paragraph).toBeInTheDocument();
expect(paragraph.textContent.length).toBeGreaterThan(100);

// Use contains for key phrases
expect(screen.getByText(/click.*button.*get started/i)).toBeInTheDocument();
```

## Best Practices

### 1. Use Partial Text Matching

Focus on key parts of the text rather than exact matches:

```javascript
// Instead of exact long text
expect(
  screen.getByText("Welcome to our application! Click here to continue."),
).toBeInTheDocument();

// Use partial matching
expect(screen.getByText(/welcome.*application/i)).toBeInTheDocument();
expect(screen.getByText("Welcome", { exact: false })).toBeInTheDocument();
```

### 2. Test by Semantic Meaning

Use ARIA roles and semantic selectors:

```javascript
// Instead of long text content
expect(
  screen.getByText("Error: Something went wrong with your request"),
).toBeVisible();

// Use semantic roles
expect(screen.getByRole("alert")).toContainText(/error.*request/i);
```

### 3. Break Down Complex Assertions

Test different parts of long content separately:

```javascript
// Instead of one long assertion
expect(element).toHaveTextContent(
  "User John Doe logged in at 2024-01-15 14:30:25 from IP 192.168.1.1",
);

// Break into logical parts
expect(element).toHaveTextContent(/John Doe/);
expect(element).toHaveTextContent(/logged in/);
expect(element).toHaveTextContent(/2024-01-15/);
```

### 4. Use Data Attributes for Complex Content

Use `data-testid` for elements with complex or variable text:

```javascript
// Markup
<div data-testid="user-info">
  Long user information with variable content...
</div>;

// Test
const userInfo = screen.getByTestId("user-info");
expect(userInfo).toBeInTheDocument();
expect(userInfo).toHaveTextContent(/user information/i);
```

### 5. Focus on User Actions and Outcomes

Test what users see and do rather than exact text:

```javascript
// Instead of exact error text
expect(
  screen.getByText(
    "Form validation failed: Username is required and must be at least 3 characters long",
  ),
).toBeVisible();

// Test the effect on user workflow
const usernameField = screen.getByLabelText(/username/i);
expect(usernameField).toBeInvalid();
expect(screen.getByRole("alert")).toBeInTheDocument();
```

### 6. Handle Localized Content

Prepare tests for internationalization:

```javascript
// Instead of hardcoded text
expect(screen.getByText("Submit Form")).toBeInTheDocument();

// Use ARIA labels that work across languages
expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();

// Or use data attributes
expect(screen.getByTestId("submit-button")).toBeInTheDocument();
```

## Framework-Specific Examples

### React Testing Library

```javascript
// ❌ Long exact matches
expect(
  screen.getByText("Welcome to React Testing Library example application"),
).toBeInTheDocument();

// ✅ Partial matching strategies
expect(screen.getByText(/welcome.*react/i)).toBeInTheDocument();
expect(screen.getByRole("heading")).toHaveTextContent(/welcome/i);
expect(screen.getByText("Welcome", { exact: false })).toBeInTheDocument();
```

### Cypress

```javascript
// ❌ Long text matching
cy.contains("This is a very long error message that might change").should(
  "be.visible",
);

// ✅ Partial matching
cy.contains(/error.*message/i).should("be.visible");
cy.get('[data-cy="error"]').should("contain", "error");
```

### Playwright

```javascript
// ❌ Exact long text
await expect(
  page.getByText("Long descriptive text that might change"),
).toBeVisible();

// ✅ Partial matching
await expect(page.getByText(/descriptive.*text/i)).toBeVisible();
await expect(page.locator('[data-testid="description"]')).toContainText(
  "descriptive",
);
```

## Common Patterns to Avoid

### Error Messages

```javascript
// ❌ Exact error text
expect(
  screen.getByText(
    "Validation error: Email is required, password must be 8+ characters",
  ),
).toBeVisible();

// ✅ Key error indicators
expect(screen.getByRole("alert")).toHaveTextContent(/validation error/i);
expect(screen.getByText(/email.*required/i)).toBeVisible();
```

### Success Messages

```javascript
// ❌ Full success text
cy.contains(
  "Your profile has been successfully updated and changes will be visible shortly",
).should("be.visible");

// ✅ Success indicators
cy.get('[role="status"]').should("contain", "successfully updated");
cy.contains(/profile.*updated/i).should("be.visible");
```

### Instructions and Help Text

```javascript
// ❌ Complete instructions
expect(
  screen.getByText(
    "To get started, please fill out the form below and click submit when ready",
  ),
).toBeInTheDocument();

// ✅ Key instruction phrases
expect(screen.getByText(/get started/i)).toBeInTheDocument();
expect(screen.getByText(/fill out.*form/i)).toBeInTheDocument();
```

## When Not To Use It

This rule may not be suitable if:

- You're testing specific copywriting or content accuracy
- You need to verify exact error message formatting
- You're working with fixed, unchangeable text content
- You're testing text processing or formatting functions

In these cases:

```javascript
// Disable for specific content verification
// eslint-disable-next-line test-flakiness/no-long-text-match
expect(screen.getByText('Exact legal disclaimer text')).toBeInTheDocument();

// Or adjust the configuration
{
  "test-flakiness/no-long-text-match": ["error", {
    "maxLength": 100,
    "allowPartialMatch": true
  }]
}
```

## Related Rules

- [no-index-queries](./no-index-queries.md) - Prevents position-dependent queries
- [no-viewport-dependent](./no-viewport-dependent.md) - Prevents viewport-dependent assertions
- [no-immediate-assertions](./no-immediate-assertions.md) - Requires proper waiting for assertions

## Further Reading

- [Testing Library - TextMatch](https://testing-library.com/docs/queries/about#textmatch)
- [Testing Library - Queries](https://testing-library.com/docs/queries/about)
- [Internationalization Testing Strategies](https://kentcdodds.com/blog/effective-snapshot-testing)
- [Cypress - Text Content](https://docs.cypress.io/guides/references/best-practices#Selecting-Elements)
- [Playwright - Text Selectors](https://playwright.dev/docs/locators#text-selectors)
