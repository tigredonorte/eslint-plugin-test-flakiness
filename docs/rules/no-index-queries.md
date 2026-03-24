# no-index-queries

Prevent using index-based queries that depend on DOM order and can break easily.

## Rule Details

Index-based queries are fragile and can lead to flaky tests:

- DOM order can change due to conditional rendering
- New elements can be added, shifting existing indexes
- Different data sets can affect element positioning
- Dynamic content loading can alter DOM structure
- CSS order changes can affect visual but not DOM order

This rule helps prevent test flakiness by detecting queries that rely on element position rather than semantic meaning.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-index-queries": [
    "error",
    {
      "allowNthChild": false,
      "allowSpecificIndices": [0, -1],
      "ignoreDataTestId": true
    }
  ]
}
```

### `allowNthChild` (default: `false`)

When set to `true`, allows CSS selectors with positional queries like `:nth-child()`, `:first-child`, and `:last-child`.

```javascript
// With allowNthChild: true
const thirdItem = document.querySelector("li:nth-child(3)"); // Allowed
const firstButton = document.querySelector("button:first-child"); // Allowed

// With allowNthChild: false (default)
const thirdItem = document.querySelector("li:nth-child(3)"); // Not allowed
const firstButton = document.querySelector("button:first-child"); // Not allowed
```

### `allowSpecificIndices` (default: `[0, -1]`)

An array of specific indices that are allowed when accessing query results. By default, allows first (`0`) and last
(`-1`) element access.

```javascript
// With allowSpecificIndices: [0, -1] (default)
const items = screen.getAllByRole("listitem");
expect(items[0]).toBeInTheDocument(); // Allowed (first element)
expect(items[items.length - 1]).toBeInTheDocument(); // Allowed (last element)
expect(items[2]).toBeInTheDocument(); // Not allowed

// With allowSpecificIndices: [0, 1, 2]
const items = screen.getAllByRole("listitem");
expect(items[2]).toBeInTheDocument(); // Now allowed

// With allowSpecificIndices: []
const items = screen.getAllByRole("listitem");
expect(items[0]).toBeInTheDocument(); // Not allowed
```

### `ignoreDataTestId` (default: `true`)

When set to `true`, ignores index usage when queries use `data-testid` attributes, since test IDs are typically stable identifiers.

```javascript
// With ignoreDataTestId: true (default)
const items = screen.getAllByTestId("list-item");
expect(items[0]).toBeInTheDocument(); // Allowed

// With ignoreDataTestId: false
const items = screen.getAllByTestId("list-item");
expect(items[0]).toBeInTheDocument(); // Not allowed
```

## Examples

### Incorrect

```javascript
// Array index access on DOM queries
const buttons = screen.getAllByRole("button");
expect(buttons[0]).toHaveTextContent("Submit");
expect(buttons[1]).toBeDisabled();

// First/last element access
const items = screen.getAllByTestId("item");
expect(items[0]).toHaveClass("first");
expect(items[items.length - 1]).toHaveClass("last");

// CSS nth-child selectors
expect(screen.getByTestId("list")).toHaveSelector(
  "li:nth-child(1)",
  "First Item",
);
expect(screen.getByTestId("list")).toHaveSelector(
  "li:nth-child(2)",
  "Second Item",
);

// Playwright index-based locators
await page.locator("button").nth(0).click();
await page.locator("li").nth(2).hover();

// Cypress index-based selections
cy.get("button").eq(0).click();
cy.get(".item").first().should("be.visible");
cy.get(".item").last().should("contain", "Last");

// jQuery-style index selection
$("button").eq(1).click();
$("li:first").text();
$("li:last").addClass("active");

// Direct array destructuring
const [firstButton, secondButton] = screen.getAllByRole("button");
expect(firstButton).toHaveTextContent("Cancel");

// Index-based assertions in loops
const items = screen.getAllByRole("listitem");
for (let i = 0; i < items.length; i++) {
  expect(items[i]).toHaveTextContent(`Item ${i + 1}`); // Fragile
}

// Table cell access by position
const rows = screen.getAllByRole("row");
expect(rows[1].cells[0]).toHaveTextContent("John");
expect(rows[1].cells[1]).toHaveTextContent("Doe");
```

### Correct

```javascript
// Use semantic queries instead of index
expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

// Query by content or attributes
expect(screen.getByText("First Item")).toHaveClass("first");
expect(screen.getByText("Last Item")).toHaveClass("last");

// Use more specific selectors
expect(screen.getByTestId("submit-button")).toHaveTextContent("Submit");
expect(screen.getByTestId("cancel-button")).toBeDisabled();

// Playwright with semantic locators
await page.getByRole("button", { name: "Submit" }).click();
await page.getByText("Menu Item").hover();

// Cypress with content-based queries
cy.contains("button", "Submit").click();
cy.get('[data-testid="first-item"]').should("be.visible");
cy.contains("Last Item").should("be.visible");

// Query by ARIA labels and roles
expect(screen.getByLabelText("Username")).toBeInTheDocument();
expect(screen.getByRole("navigation")).toContainElement(
  screen.getByRole("link", { name: "Home" }),
);

// Use within() to scope queries
const navigation = screen.getByRole("navigation");
expect(
  within(navigation).getByRole("link", { name: "Home" }),
).toBeInTheDocument();

// Table queries by content
const table = screen.getByRole("table");
const johnRow = within(table).getByRole("row", { name: /john/i });
expect(within(johnRow).getByRole("cell", { name: "John" })).toBeInTheDocument();

// Use find queries for dynamic content
const firstItem = await screen.findByText("First Item");
expect(firstItem).toBeInTheDocument();

// Content-based assertions
const items = screen.getAllByRole("listitem");
expect(items).toHaveLength(3);
items.forEach((item, index) => {
  expect(item).toHaveTextContent(expectedContent[index]);
});
```

## Best Practices

### 1. Use Semantic Queries

Always prefer queries that describe what the element is, not where it is:

```javascript
// Instead of position-based
const buttons = screen.getAllByRole("button");
await user.click(buttons[0]);

// Use semantic meaning
await user.click(screen.getByRole("button", { name: "Submit" }));
```

### 2. Query by User-Visible Content

Test what users see, not DOM structure:

```javascript
// Instead of DOM position
const items = screen.getAllByTestId("item");
expect(items[2]).toBeVisible();

// Use user-visible content
expect(screen.getByText("Third Item")).toBeVisible();
```

### 3. Use within() for Scoped Queries

Use `within()` to query inside specific containers:

```javascript
// Instead of assuming order
const rows = screen.getAllByRole("row");
expect(rows[1]).toHaveTextContent("John");

// Use scoped queries
const table = screen.getByRole("table");
const johnRow = within(table).getByRole("row", { name: /john/i });
expect(johnRow).toBeInTheDocument();
```

### 4. Test Collections Semantically

When testing collections, focus on content rather than position:

```javascript
// Instead of index-based testing
const items = screen.getAllByRole("listitem");
expect(items[0]).toHaveTextContent("Apple");
expect(items[1]).toHaveTextContent("Banana");

// Test the collection as a whole
expect(screen.getByText("Apple")).toBeInTheDocument();
expect(screen.getByText("Banana")).toBeInTheDocument();
expect(screen.getAllByRole("listitem")).toHaveLength(2);
```

### 5. Use Data Attributes Wisely

Use `data-testid` for elements that are hard to query semantically:

```javascript
// When semantic queries are insufficient
<button data-testid="primary-action">Submit</button>
<button data-testid="secondary-action">Cancel</button>

// Query by test ID instead of position
expect(screen.getByTestId('primary-action')).toHaveTextContent('Submit');
expect(screen.getByTestId('secondary-action')).toBeDisabled();
```

### 6. Handle Dynamic Lists Properly

For dynamic content, test behavior rather than specific positions:

```javascript
// Instead of fixed positions
const items = screen.getAllByRole("listitem");
expect(items[0]).toHaveTextContent("Most Recent");

// Test the sorting/filtering behavior
await user.click(screen.getByRole("button", { name: "Sort by Date" }));
expect(screen.getByText("Most Recent")).toBeInTheDocument();
const sortedItems = screen.getAllByRole("listitem");
expect(sortedItems[0]).toHaveAttribute("data-date", mostRecentDate);
```

## Framework-Specific Examples

### React Testing Library

```javascript
// ❌ Index-based queries
const buttons = screen.getAllByRole("button");
fireEvent.click(buttons[0]);

// ✅ Semantic queries
fireEvent.click(screen.getByRole("button", { name: "Submit" }));

// ✅ Use within() for complex structures
const form = screen.getByRole("form");
const submitButton = within(form).getByRole("button", { name: "Submit" });
```

### Cypress

```javascript
// ❌ Index-based selectors
cy.get("button").eq(0).click();

// ✅ Content-based selectors
cy.contains("button", "Submit").click();
cy.get('[data-cy="submit-btn"]').click();

// ✅ Use aliases for complex selectors
cy.get('[data-testid="user-list"]').as("userList");
cy.get("@userList").contains("John Doe").click();
```

### Playwright

```javascript
// ❌ Index-based locators
await page.locator("button").nth(0).click();

// ✅ Semantic locators
await page.getByRole("button", { name: "Submit" }).click();
await page.getByText("Submit").click();

// ✅ Use page.locator with specific attributes
await page.locator('[data-testid="submit-button"]').click();
```

## Common Anti-patterns

### Arrays with Index Access

```javascript
// ❌ Fragile
const items = screen.getAllByRole("listitem");
expect(items[0]).toHaveTextContent("First");

// ✅ Robust
expect(screen.getByRole("listitem", { name: "First" })).toBeInTheDocument();
```

### CSS nth-child Selectors

```javascript
// ❌ Position-dependent
cy.get("li:nth-child(1)").should("contain", "First Item");

// ✅ Content-dependent
cy.contains("li", "First Item").should("be.visible");
```

### First/Last Element Shortcuts

```javascript
// ❌ Order-dependent
cy.get(".item").first().click();

// ✅ Semantically meaningful
cy.get('[data-testid="primary-item"]').click();
```

## When Not To Use It

This rule may not be suitable if:

- You're testing components with guaranteed stable order
- You're specifically testing sorting or ordering functionality
- You're working with table structures where position is semantically meaningful
- You're testing pagination or carousel components

In these cases:

```javascript
// Disable for specific scenarios
// eslint-disable-next-line test-flakiness/no-index-queries
expect(sortedItems[0]).toHaveTextContent('A-item');

// Or configure stable containers
{
  "test-flakiness/no-index-queries": ["error", {
    "allowInStableContainers": true
  }]
}
```

## Related Rules

- [no-long-text-match](./no-long-text-match.md) - Encourages partial text matching
- [no-viewport-dependent](./no-viewport-dependent.md) - Prevents viewport-dependent queries
- [no-immediate-assertions](./no-immediate-assertions.md) - Prevents assertions without waiting

## Further Reading

- [Testing Library - Queries](https://testing-library.com/docs/queries/about)
- [Testing Library - Priority](https://testing-library.com/docs/queries/about#priority)
- [Playwright - Locators](https://playwright.dev/docs/locators)
- [Cypress - Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [ARIA - Roles and Properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
