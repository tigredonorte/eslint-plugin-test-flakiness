# no-test-isolation

Prevent test interdependencies that can cause failures when tests run in different orders.

## Rule Details

Test isolation violations occur when tests depend on the execution or state of other tests:

- Tests may pass when run individually but fail in suites
- Test execution order affects outcomes
- Shared state between tests creates dependencies
- Setup/teardown issues can leak between tests
- Global modifications persist across test boundaries

This rule helps prevent test flakiness by detecting patterns that violate test isolation principles.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-test-isolation": [
    "error",
    {
      "allowSharedSetup": true,
      "checkGlobalState": true,
      "allowedSharedVariables": []
    }
  ]
}
```

### `allowSharedSetup` (default: `true`)

When set to `true`, allows shared setup in `beforeAll`/`beforeEach` hooks.

```javascript
// With allowSharedSetup: true (default)
beforeAll(() => {
  global.testDatabase = createTestDatabase(); // ✅ Allowed
});

// With allowSharedSetup: false
beforeAll(() => {
  global.testDatabase = createTestDatabase(); // ❌ Not allowed
});
```

### `checkGlobalState` (default: `true`)

When set to `true`, checks for global state modifications that could affect other tests.

```javascript
// With checkGlobalState: true (default)
test("should do something", () => {
  global.config = { debug: true }; // ❌ Flagged
});

// With checkGlobalState: false
test("should do something", () => {
  global.config = { debug: true }; // ✅ Ignored
});
```

### `allowedSharedVariables` (default: `[]`)

Array of variable names that are allowed to be shared between tests.

```javascript
// With allowedSharedVariables: ["testUtils"]
let testUtils = createTestUtils(); // ✅ Allowed

// With allowedSharedVariables: []
let sharedData = {}; // ❌ Not allowed
```

## Examples

### ❌ Incorrect

```javascript
// Shared variables between tests
let userData = {};
let counter = 0;

test("creates user", () => {
  userData = { id: 1, name: "John" };
  counter++;
});

test("uses user data", () => {
  expect(userData.name).toBe("John"); // Depends on previous test
  expect(counter).toBe(1); // Order dependent
});

// Tests that modify global state
test("sets global config", () => {
  process.env.NODE_ENV = "test";
  global.apiUrl = "http://localhost";
});

test("uses global config", () => {
  expect(global.apiUrl).toBe("http://localhost"); // Depends on previous test
});

// DOM modifications that persist
test("adds elements to DOM", () => {
  document.body.innerHTML = '<div id="test">Test</div>';
});

test("expects DOM elements", () => {
  expect(document.getElementById("test")).toBeTruthy(); // Depends on previous test
});

// File system modifications
test("creates test file", () => {
  fs.writeFileSync("test.txt", "content");
});

test("reads test file", () => {
  const content = fs.readFileSync("test.txt"); // Depends on file creation
  expect(content.toString()).toBe("content");
});

// Database state dependencies
test("creates user in database", () => {
  database.users.insert({ id: 1, name: "John" });
});

test("finds user in database", () => {
  const user = database.users.findById(1); // Depends on previous insert
  expect(user.name).toBe("John");
});

// Mock state that persists
let mockFn = jest.fn();

test("calls mock function", () => {
  mockFn("test");
  expect(mockFn).toHaveBeenCalledWith("test");
});

test("expects mock to have been called", () => {
  expect(mockFn).toHaveBeenCalled(); // Depends on previous test
});

// Class/object state sharing
class TestState {
  constructor() {
    this.value = 0;
  }
}

const testState = new TestState();

test("increments value", () => {
  testState.value++;
});

test("expects incremented value", () => {
  expect(testState.value).toBe(1); // Depends on previous test
});
```

### ✅ Correct

```javascript
// Each test is self-contained
test("creates user", () => {
  const userData = { id: 1, name: "John" };
  expect(userData.name).toBe("John");
});

test("processes user data", () => {
  const userData = { id: 2, name: "Jane" }; // Own test data
  expect(processUser(userData)).toBeDefined();
});

// Proper setup and teardown
describe("User management", () => {
  let testDatabase;

  beforeEach(() => {
    testDatabase = createTestDatabase();
  });

  afterEach(() => {
    testDatabase.cleanup();
  });

  test("creates user", () => {
    const user = testDatabase.createUser({ name: "John" });
    expect(user.name).toBe("John");
  });

  test("finds user", () => {
    const user = testDatabase.createUser({ name: "Jane" });
    const found = testDatabase.findUser(user.id);
    expect(found.name).toBe("Jane");
  });
});

// DOM cleanup between tests
describe("DOM tests", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("adds elements", () => {
    document.body.innerHTML = '<div id="test">Test</div>';
    expect(document.getElementById("test")).toBeTruthy();
  });

  test("works with clean DOM", () => {
    document.body.innerHTML = '<div id="other">Other</div>';
    expect(document.getElementById("other")).toBeTruthy();
  });
});

// File system cleanup
describe("File operations", () => {
  const testFile = "test.txt";

  afterEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  test("creates file", () => {
    fs.writeFileSync(testFile, "content");
    expect(fs.existsSync(testFile)).toBeTruthy();
  });

  test("works independently", () => {
    // File doesn't exist from previous test
    expect(fs.existsSync(testFile)).toBeFalsy();
    fs.writeFileSync(testFile, "new content");
    expect(fs.readFileSync(testFile, "utf8")).toBe("new content");
  });
});

// Fresh mocks for each test
describe("Mock tests", () => {
  let mockFn;

  beforeEach(() => {
    mockFn = jest.fn();
  });

  test("calls mock function", () => {
    mockFn("test");
    expect(mockFn).toHaveBeenCalledWith("test");
  });

  test("has fresh mock", () => {
    expect(mockFn).not.toHaveBeenCalled(); // Clean mock
    mockFn("other");
    expect(mockFn).toHaveBeenCalledWith("other");
  });
});

// Factory functions for test data
function createTestUser(overrides = {}) {
  return {
    id: Math.random(), // Or use deterministic ID
    name: "Test User",
    ...overrides,
  };
}

test("processes user A", () => {
  const user = createTestUser({ name: "Alice" });
  expect(processUser(user)).toBeDefined();
});

test("processes user B", () => {
  const user = createTestUser({ name: "Bob" });
  expect(processUser(user)).toBeDefined();
});
```

## Best Practices

### 1. Use beforeEach/afterEach for Setup/Teardown

Ensure each test starts with a clean state:

```javascript
describe("Component tests", () => {
  let component;

  beforeEach(() => {
    component = createComponent();
  });

  afterEach(() => {
    component.destroy();
  });

  test("renders correctly", () => {
    expect(component.render()).toMatchSnapshot();
  });

  test("handles props", () => {
    component.setProps({ title: "Test" });
    expect(component.getTitle()).toBe("Test");
  });
});
```

### 2. Avoid Shared Variables

Keep test data local to each test:

```javascript
// Instead of shared state
let sharedUser = {};

test("creates user", () => {
  sharedUser = createUser();
});

test("uses user", () => {
  expect(sharedUser.name).toBeDefined(); // Risky dependency
});

// Use local state
test("creates and uses user", () => {
  const user = createUser();
  expect(user.name).toBeDefined();
});
```

### 3. Clean Up Global State

Reset global modifications after each test:

```javascript
describe("Environment tests", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test("works in development", () => {
    process.env.NODE_ENV = "development";
    expect(getConfig()).toMatchObject({ debug: true });
  });

  test("works in production", () => {
    process.env.NODE_ENV = "production";
    expect(getConfig()).toMatchObject({ debug: false });
  });
});
```

### 4. Use Test-Specific Databases

Create isolated database instances:

```javascript
describe("Database operations", () => {
  let db;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  test("creates record", async () => {
    const record = await db.create({ name: "Test" });
    expect(record.id).toBeDefined();
  });

  test("finds record", async () => {
    const created = await db.create({ name: "Find Me" });
    const found = await db.findById(created.id);
    expect(found.name).toBe("Find Me");
  });
});
```

### 5. Reset Mocks Between Tests

Ensure mocks don't carry state:

```javascript
describe("API tests", () => {
  const mockApi = jest.fn();

  beforeEach(() => {
    mockApi.mockClear(); // or mockReset()
  });

  test("calls API once", () => {
    callService(mockApi);
    expect(mockApi).toHaveBeenCalledTimes(1);
  });

  test("calls API with correct data", () => {
    callService(mockApi, { data: "test" });
    expect(mockApi).toHaveBeenCalledWith({ data: "test" });
  });
});
```

### 6. Use Factory Functions

Create fresh test data for each test:

```javascript
// Test data factory
function createTestOrder(overrides = {}) {
  return {
    id: `order-${Date.now()}`,
    items: [],
    total: 0,
    ...overrides,
  };
}

test("calculates total", () => {
  const order = createTestOrder({
    items: [{ price: 10 }, { price: 20 }],
  });
  expect(calculateTotal(order)).toBe(30);
});

test("handles empty order", () => {
  const order = createTestOrder();
  expect(calculateTotal(order)).toBe(0);
});
```

## Framework-Specific Examples

### Jest

```javascript
// ✅ Proper test isolation
describe("UserService", () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  test("creates user", () => {
    const user = userService.create({ name: "John" });
    expect(user.id).toBeDefined();
  });

  test("validates user", () => {
    const result = userService.validate({ name: "" });
    expect(result.valid).toBe(false);
  });
});
```

### Cypress

```javascript
// ✅ Clean state between tests
describe("User workflow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit("/login");
  });

  it("logs in user", () => {
    cy.get('[data-cy="username"]').type("testuser");
    cy.get('[data-cy="password"]').type("password");
    cy.get('[data-cy="login"]').click();
    cy.url().should("include", "/dashboard");
  });

  it("shows error for invalid credentials", () => {
    cy.get('[data-cy="username"]').type("invalid");
    cy.get('[data-cy="password"]').type("invalid");
    cy.get('[data-cy="login"]').click();
    cy.get('[data-cy="error"]').should("be.visible");
  });
});
```

### Playwright

```javascript
// ✅ Isolated contexts
test.describe("Authentication", () => {
  test("successful login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="username"]', "user");
    await page.fill('[data-testid="password"]', "pass");
    await page.click('[data-testid="login"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("failed login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="username"]', "invalid");
    await page.fill('[data-testid="password"]', "invalid");
    await page.click('[data-testid="login"]');
    await expect(page.locator('[data-testid="error"]')).toBeVisible();
  });
});
```

## When Not To Use It

This rule may not be suitable if:

- You're testing integration scenarios that require shared state
- You're using test frameworks that handle isolation automatically
- You have legitimate shared setup that doesn't affect test outcomes

In these cases:

```javascript
// Disable for legitimate shared state
// eslint-disable-next-line test-flakiness/no-test-isolation
const sharedTestDatabase = createDatabase();

// Or configure to allow specific patterns
{
  "test-flakiness/no-test-isolation": ["error", {
    "allowSharedSetup": true,
    "allowedSharedVariables": ["testDatabase", "mockServer"]
  }]
}
```

## Related Rules

- [no-global-state-mutation](./no-global-state-mutation.md) - Prevents global state modifications
- [no-random-data](./no-random-data.md) - Ensures deterministic test data
- [no-unconditional-wait](./no-unconditional-wait.md) - Prevents timing-dependent tests

## Further Reading

- [Jest - Setup and Teardown](https://jestjs.io/docs/setup-teardown)
- [Test Isolation Principles](https://martinfowler.com/bliki/TestIsolation.html)
- [xUnit Test Patterns - Fresh Fixture](http://xunitpatterns.com/Fresh%20Fixture.html)
- [Cypress - Test Isolation](https://docs.cypress.io/guides/references/best-practices#Having-tests-rely-on-the-state-of-previous-tests)
- [Playwright - Test Isolation](https://playwright.dev/docs/browser-contexts)
