# no-viewport-dependent

Prevent tests that depend on specific viewport sizes or screen dimensions.

## Rule Details

Viewport-dependent tests are brittle and can fail across different environments:

- Different screen resolutions and display densities
- Varying browser window sizes in CI/CD environments
- Mobile vs desktop viewport differences
- Browser zoom levels affecting element positioning
- CSS media queries changing layout based on viewport size
- Element visibility depending on scroll position

This rule helps prevent test flakiness by detecting tests that rely on specific viewport dimensions or screen properties.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-viewport-dependent": [
    "error",
    {
      "allowViewportSetup": true,
      "allowResponsiveTests": false,
      "ignoreMediaQueries": false
    }
  ]
}
```

### `allowViewportSetup` (default: `true`)

When set to `true`, allows viewport configuration in test setup hooks.

```javascript
// With allowViewportSetup: true (default)
beforeEach(() => {
  cy.viewport(1920, 1080); // ✅ Allowed in setup
});

// With allowViewportSetup: false
beforeEach(() => {
  cy.viewport(1920, 1080); // ❌ Not allowed
});
```

### `allowResponsiveTests` (default: `false`)

When set to `true`, allows tests specifically designed for responsive design testing.

```javascript
// With allowResponsiveTests: true
describe("Responsive design", () => {
  cy.viewport("macbook-15");
  cy.get('[data-cy="mobile-menu"]').should("not.be.visible"); // ✅ Allowed
});

// With allowResponsiveTests: false (default)
cy.get('[data-cy="mobile-menu"]').should("not.be.visible"); // ❌ Not allowed
```

### `ignoreMediaQueries` (default: `false`)

When set to `true`, ignores tests that specifically test CSS media query behavior.

```javascript
// With ignoreMediaQueries: true
expect(window.matchMedia("(max-width: 768px)").matches).toBe(true); // ✅ Ignored

// With ignoreMediaQueries: false (default)
expect(window.matchMedia("(max-width: 768px)").matches).toBe(true); // ❌ Not allowed
```

## Examples

### ❌ Incorrect

```javascript
// Viewport size checks
expect(window.innerWidth).toBe(1920);
expect(window.innerHeight).toBeGreaterThan(1000);

// Screen dimension checks
expect(screen.width).toBe(1920);
expect(screen.height).toBe(1080);

// Media query matching
expect(window.matchMedia("(max-width: 768px)").matches).toBe(false);
expect(window.matchMedia("(min-width: 1200px)").matches).toBe(true);

// Element position checks that depend on viewport
expect(element.getBoundingClientRect().top).toBe(100);
expect(element.offsetLeft).toBeLessThan(500);

// Scroll position checks
expect(window.scrollY).toBe(0);
expect(document.documentElement.scrollTop).toBeGreaterThan(200);

// CSS computed style checks that vary by viewport
expect(getComputedStyle(element).display).toBe("none"); // Hidden on mobile
expect(getComputedStyle(element).width).toBe("300px");

// Viewport-dependent visibility checks
expect(element).toBeVisible(); // May fail on different screen sizes
cy.get(".mobile-menu").should("be.visible"); // Depends on viewport

// Playwright viewport-dependent tests
await expect(page.locator(".desktop-only")).toBeVisible();
await page.setViewportSize({ width: 375, height: 667 });
await expect(page.locator(".mobile-only")).toBeVisible();

// Element positioning assertions
const rect = await element.boundingBox();
expect(rect.x).toBe(100); // Position depends on viewport
expect(rect.y).toBeLessThan(300);

// Responsive grid/layout checks
const columns = await page.locator(".grid-column").count();
expect(columns).toBe(3); // May be different on smaller screens

// Touch/hover behavior based on device type
if ("ontouchstart" in window) {
  expect(touchEnabled).toBe(true);
}

// Orientation-dependent tests
expect(window.orientation).toBe(0); // Portrait
expect(screen.orientation.angle).toBe(90); // Landscape

// CSS breakpoint testing
cy.viewport("iphone-6");
cy.get(".hamburger-menu").should("be.visible");
```

### ✅ Correct

```javascript
// Test functionality regardless of viewport
expect(getUserData()).toEqual(expectedData);
expect(calculateTotal(items)).toBe(150);

// Use semantic queries instead of position-based
expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
expect(screen.getByText("Welcome")).toBeVisible();

// Test responsive behavior with explicit viewport setup
describe("Navigation", () => {
  beforeEach(() => {
    // Set consistent viewport for all tests in this suite
    cy.viewport(1920, 1080);
  });

  it("shows desktop navigation", () => {
    cy.get('[data-cy="desktop-nav"]').should("be.visible");
    cy.get('[data-cy="mobile-nav"]').should("not.exist");
  });
});

// Test both responsive states explicitly
describe("Responsive menu", () => {
  it("shows desktop menu on large screens", () => {
    cy.viewport(1200, 800);
    cy.get('[data-cy="desktop-menu"]').should("be.visible");
  });

  it("shows mobile menu on small screens", () => {
    cy.viewport(375, 667);
    cy.get('[data-cy="mobile-menu"]').should("be.visible");
  });
});

// Use data attributes for responsive elements
<nav data-testid={isMobile ? "mobile-nav" : "desktop-nav"}>
  {/* Navigation content */}
</nav>;

// Test with CSS classes instead of viewport dimensions
expect(element).toHaveClass("mobile-layout");
expect(element).not.toHaveClass("desktop-layout");

// Mock viewport-related APIs in tests
beforeEach(() => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
});

// Test behavior instead of layout
test("toggles menu visibility", async () => {
  const user = userEvent.setup();
  render(<Navigation />);

  const menuToggle = screen.getByRole("button", { name: /menu/i });
  await user.click(menuToggle);

  expect(screen.getByRole("navigation")).toBeInTheDocument();
});

// Use Playwright with consistent viewport setup
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
});

// Test content accessibility regardless of layout
test("all content is accessible", async ({ page }) => {
  await page.goto("/");

  // Test that all interactive elements are reachable
  const buttons = await page.locator("button").all();
  for (const button of buttons) {
    await expect(button).toBeEnabled();
  }
});

// Mock CSS media queries for consistent testing
const createMatchMedia = (width) => {
  return (query) => ({
    matches: evaluateMediaQuery(query, width),
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
};

window.matchMedia = createMatchMedia(1024);
```

## Best Practices

### 1. Set Consistent Viewport in Test Setup

Establish a standard viewport for all tests:

```javascript
// Cypress
beforeEach(() => {
  cy.viewport(1280, 720); // Standard viewport for all tests
});

// Playwright
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
});

// Puppeteer
beforeEach(async () => {
  await page.setViewport({ width: 1280, height: 720 });
});
```

### 2. Test Responsive Behavior Explicitly

When testing responsive design, be explicit about viewport changes:

```javascript
describe("Responsive design", () => {
  const testViewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ];

  testViewports.forEach(({ name, width, height }) => {
    describe(`${name} viewport`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
      });

      it("displays appropriate navigation", () => {
        if (name === "mobile") {
          cy.get('[data-cy="mobile-nav"]').should("be.visible");
        } else {
          cy.get('[data-cy="desktop-nav"]').should("be.visible");
        }
      });
    });
  });
});
```

### 3. Use Semantic Queries Instead of Position-Based

Focus on what users see and do rather than layout details:

```javascript
// Instead of position-based checks
expect(element.getBoundingClientRect().top).toBe(100);

// Use semantic meaning
expect(screen.getByRole("banner")).toBeInTheDocument();
expect(screen.getByRole("navigation")).toBeVisible();
```

### 4. Mock Viewport-Related APIs

Mock browser APIs that depend on viewport:

```javascript
const mockMatchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation(mockMatchMedia);

  // Mock specific breakpoints
  window.matchMedia.mockImplementation((query) => {
    if (query === "(max-width: 768px)") {
      return { ...mockMatchMedia(query), matches: false };
    }
    return mockMatchMedia(query);
  });
});
```

### 5. Test Behavior, Not Layout

Focus on functional testing rather than visual layout:

```javascript
// Instead of testing specific layout
expect(getComputedStyle(element).display).toBe("grid");

// Test the behavior
test("displays all navigation items", () => {
  const navItems = ["Home", "About", "Contact"];
  navItems.forEach((item) => {
    expect(screen.getByRole("link", { name: item })).toBeInTheDocument();
  });
});
```

### 6. Use CSS Classes for State Detection

Use CSS classes to indicate responsive states:

```javascript
// Component with responsive logic
function Navigation() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
  }, []);

  return (
    <nav className={isMobile ? "mobile-nav" : "desktop-nav"}>
      {/* Navigation content */}
    </nav>
  );
}

// Test with class-based assertions
expect(screen.getByRole("navigation")).toHaveClass("desktop-nav");
```

## Framework-Specific Examples

### React Testing Library

```javascript
// Mock window properties
beforeEach(() => {
  // Mock window.innerWidth
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });

  // Mock matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query.includes("1024"),
      media: query,
    })),
  });
});
```

### Cypress

```javascript
// Viewport testing with explicit setup
describe("Responsive Components", () => {
  const viewports = [
    { device: "mobile", width: 375, height: 667 },
    { device: "desktop", width: 1920, height: 1080 },
  ];

  viewports.forEach(({ device, width, height }) => {
    context(`${device} view`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
      });

      it("renders correctly", () => {
        cy.visit("/");
        cy.get('[data-cy="content"]').should("be.visible");
      });
    });
  });
});
```

### Playwright

```javascript
// Test multiple viewports
const devices = ["Desktop Chrome", "iPhone 12", "iPad Pro"];

devices.forEach((deviceName) => {
  test.describe(`${deviceName}`, () => {
    test.use({ ...devices[deviceName] });

    test("renders navigation", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("nav")).toBeVisible();
    });
  });
});
```

## When Not To Use It

This rule may not be suitable if:

- You're specifically testing responsive design behavior
- You're building viewport-aware components or libraries
- You're testing CSS media query functionality
- You're working with maps or visualization components that depend on dimensions

In these cases:

```javascript
// Disable for responsive design tests
// eslint-disable-next-line test-flakiness/no-viewport-dependent
expect(window.matchMedia('(max-width: 768px)').matches).toBe(true);

// Or configure for responsive testing
{
  "test-flakiness/no-viewport-dependent": ["error", {
    "allowResponsiveTests": true,
    "allowViewportSetup": true
  }]
}
```

## Related Rules

- [no-index-queries](./no-index-queries.md) - Prevents position-dependent queries
- [no-animation-wait](./no-animation-wait.md) - Prevents animation timing dependencies
- [no-immediate-assertions](./no-immediate-assertions.md) - Requires proper waiting

## Further Reading

- [Responsive Design Testing Strategies](https://web.dev/responsive-web-design-basics/)
- [Cypress - Viewport Testing](https://docs.cypress.io/api/commands/viewport)
- [Playwright - Emulation](https://playwright.dev/docs/emulation)
- [Testing Library - Responsive Tests](https://kentcdodds.com/blog/testing-implementation-details)
- [CSS Media Queries in Tests](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Testing_media_queries)
