# no-random-data

Prevent using random data in tests which can cause non-deterministic failures.

## Rule Details

Random data in tests creates non-deterministic behavior that can lead to flaky tests:

- Random values may occasionally trigger edge cases
- Different test runs produce different results
- Debugging becomes difficult when failures can't be reproduced
- Test assertions may work with some random values but fail with others
- Random timing can affect async operations

This rule helps prevent test flakiness by detecting the use of random data generation that could cause unpredictable test behavior.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-random-data": [
    "error",
    {
      "allowInSetup": false,
      "allowSeededRandom": true,
      "allowedMethods": []
    }
  ]
}
```

### `allowInSetup` (default: `false`)

When set to `true`, allows random data generation in setup hooks if properly seeded.

```javascript
// With allowInSetup: true
beforeEach(() => {
  Math.seedrandom("fixed-seed");
  const testData = generateRandomData(); // Allowed with seed
});

// With allowInSetup: false (default)
beforeEach(() => {
  const testData = generateRandomData(); // Not allowed
});
```

### `allowSeededRandom` (default: `true`)

When set to `true`, allows random data generation when a seed is provided.

```javascript
// With allowSeededRandom: true (default)
const faker = require("faker");
faker.seed(123);
const name = faker.name.firstName(); // Allowed

// With allowSeededRandom: false
faker.seed(123);
const name = faker.name.firstName(); // Not allowed
```

### `allowedMethods` (default: `[]`)

Array of method names that are allowed to use random data.

```javascript
// With allowedMethods: ["generateTestId"]
const id = generateTestId(); // Allowed

// With allowedMethods: []
const id = generateTestId(); // Not allowed if it uses random data
```

## Examples

### Incorrect

```javascript
// Math.random() usage
const randomValue = Math.random();
const randomNumber = Math.random() * 100;
const randomIndex = Math.floor(Math.random() * array.length);

// Date-based randomness
const randomDate = new Date(Date.now() + Math.random() * 1000000);
const timestamp = Date.now();

// Random string generation
const randomString = Math.random().toString(36).substring(7);
const uuid = crypto.randomUUID();

// Array shuffling
const shuffled = array.sort(() => Math.random() - 0.5);

// Random selection
const randomItem = items[Math.floor(Math.random() * items.length)];
const sample = lodash.sample(collection);

// Faker.js without seed
const faker = require("faker");
const randomName = faker.name.firstName();
const randomEmail = faker.internet.email();
const randomData = faker.datatype.json();

// Random delays in tests
await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

// Random test data generation
const testUser = {
  id: Math.random(),
  name: generateRandomName(),
  age: Math.floor(Math.random() * 100),
};

// Random mock responses
jest.fn().mockReturnValue(Math.random() > 0.5 ? "success" : "failure");

// Chance.js usage
const chance = new Chance();
const randomBool = chance.bool();
const randomInteger = chance.integer();

// Random CSS values in tests
element.style.width = `${Math.random() * 300}px`;

// Random coordinates
const x = Math.random() * window.innerWidth;
const y = Math.random() * window.innerHeight;
```

### Correct

```javascript
// Use fixed test data
const fixedValue = 42;
const fixedNumber = 150;
const fixedIndex = 0; // or specific meaningful index

// Use deterministic dates
const fixedDate = new Date("2024-01-15T10:00:00Z");
const testTimestamp = 1642248000000; // Fixed timestamp

// Use meaningful strings
const testString = "test-string-123";
const testId = "user-123";

// Use deterministic ordering
const orderedArray = array.sort((a, b) => a.id - b.id);

// Select specific items
const firstItem = items[0];
const specificItem = items.find((item) => item.id === "test-id");

// Use seeded Faker.js
const faker = require("faker");
faker.seed(123); // Fixed seed
const deterministicName = faker.name.firstName();
const deterministicEmail = faker.internet.email();

// Use fixed delays
await new Promise((resolve) => setTimeout(resolve, 100));

// Use predictable test data
const testUser = {
  id: "user-123",
  name: "John Doe",
  age: 30,
};

// Use consistent mock responses
jest.fn().mockReturnValue("success");
jest.fn().mockReturnValueOnce("failure").mockReturnValue("success");

// Use factory functions with fixed data
function createTestUser(overrides = {}) {
  return {
    id: "user-123",
    name: "John Doe",
    age: 30,
    ...overrides,
  };
}

// Use deterministic CSS values
element.style.width = "300px";
element.style.height = "200px";

// Use fixed coordinates
const testX = 100;
const testY = 150;

// Use data-driven tests for multiple scenarios
const testCases = [
  { input: "value1", expected: "result1" },
  { input: "value2", expected: "result2" },
];
testCases.forEach((testCase) => {
  test(`should handle ${testCase.input}`, () => {
    expect(process(testCase.input)).toBe(testCase.expected);
  });
});
```

## Best Practices

### 1. Use Fixed Test Data

Replace random data with predetermined values:

```javascript
// Instead of random data
const user = {
  id: Math.random(),
  name: faker.name.firstName(),
  email: faker.internet.email(),
};

// Use fixed test data
const user = {
  id: "user-123",
  name: "John Doe",
  email: "john.doe@example.com",
};
```

### 2. Create Test Data Factories

Build factories that generate consistent test data:

```javascript
// Instead of random generation
function createRandomUser() {
  return {
    id: Math.random(),
    name: faker.name.firstName(),
  };
}

// Use deterministic factories
function createTestUser(overrides = {}) {
  return {
    id: "user-123",
    name: "John Doe",
    email: "john.doe@example.com",
    ...overrides,
  };
}

// For multiple variations
const TEST_USERS = {
  admin: createTestUser({ role: "admin", name: "Admin User" }),
  regular: createTestUser({ role: "user", name: "Regular User" }),
  guest: createTestUser({ role: "guest", name: "Guest User" }),
};
```

### 3. Use Seeded Random Generators

When randomness is needed, use seeded generators:

```javascript
// Setup seeded randomness
beforeAll(() => {
  // Use a fixed seed for reproducible tests
  faker.seed(123);
  Math.seedrandom("test-seed");
});

// Now random data is deterministic
const testData = faker.datatype.array(10);
```

### 4. Use Property-Based Testing Libraries

For comprehensive testing, use property-based testing with seeds:

```javascript
const fc = require("fast-check");

// Property-based test with seed
test("should handle all string inputs", () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      const result = processString(input);
      expect(typeof result).toBe("string");
    }),
    { seed: 42 }, // Fixed seed for reproducibility
  );
});
```

### 5. Handle Edge Cases Explicitly

Instead of hoping random data hits edge cases, test them explicitly:

```javascript
// Instead of hoping random data triggers edge cases
test("handles various inputs", () => {
  for (let i = 0; i < 100; i++) {
    const randomInput = Math.random() * 1000;
    expect(process(randomInput)).toBeDefined();
  }
});

// Test edge cases explicitly
const edgeCases = [0, -1, 1, Infinity, -Infinity, NaN, null, undefined, ""];
edgeCases.forEach((edgeCase) => {
  test(`handles edge case: ${edgeCase}`, () => {
    expect(process(edgeCase)).toBeDefined();
  });
});
```

### 6. Use Deterministic Mock Data

Create consistent mock responses:

```javascript
// Instead of random mock responses
const mockApi = jest.fn().mockImplementation(() => {
  return Math.random() > 0.5
    ? Promise.resolve({ success: true })
    : Promise.reject(new Error("Random failure"));
});

// Use predictable mocks
const mockApi = jest
  .fn()
  .mockResolvedValueOnce({ success: true })
  .mockRejectedValueOnce(new Error("Expected failure"))
  .mockResolvedValue({ success: true }); // Default
```

## Framework-Specific Examples

### Jest

```javascript
// ❌ Random test data
test("processes user data", () => {
  const user = {
    id: Math.random(),
    name: faker.name.firstName(),
  };
  expect(processUser(user)).toBeDefined();
});

// ✅ Fixed test data
test("processes user data", () => {
  const user = {
    id: "user-123",
    name: "John Doe",
  };
  expect(processUser(user)).toEqual(expectedResult);
});
```

### Cypress

```javascript
// ❌ Random form data
cy.get('[data-cy="name"]').type(faker.name.firstName());
cy.get('[data-cy="email"]').type(faker.internet.email());

// ✅ Fixed form data
cy.get('[data-cy="name"]').type("John Doe");
cy.get('[data-cy="email"]').type("john.doe@example.com");

// ✅ Or use data-driven approach
const testUsers = [
  { name: "John Doe", email: "john@example.com" },
  { name: "Jane Smith", email: "jane@example.com" },
];

testUsers.forEach((user) => {
  it(`should handle user ${user.name}`, () => {
    cy.get('[data-cy="name"]').type(user.name);
    cy.get('[data-cy="email"]').type(user.email);
  });
});
```

### Playwright

```javascript
// ❌ Random element selection
const randomButton = page.locator("button").nth(Math.floor(Math.random() * 3));
await randomButton.click();

// ✅ Specific element selection
await page.locator('button[data-testid="submit"]').click();

// ✅ Test all buttons systematically
const buttons = ["submit", "cancel", "reset"];
for (const button of buttons) {
  await test.step(`testing ${button} button`, async () => {
    await page.locator(`button[data-testid="${button}"]`).click();
  });
}
```

## Common Random Data Anti-patterns

### Random IDs

```javascript
// ❌ Random IDs that may conflict
const id = Math.random().toString();

// ✅ Deterministic IDs
const id = `test-user-${index}`;
```

### Random Timing

```javascript
// ❌ Random delays
await page.waitForTimeout(Math.random() * 1000);

// ✅ Fixed timing or conditional waiting
await page.waitForTimeout(500);
await page.waitForSelector(".loaded");
```

### Random Selection

```javascript
// ❌ Random array element
const item = array[Math.floor(Math.random() * array.length)];

// ✅ Specific or all elements
const item = array[0]; // First item
array.forEach((item) => {
  /* test each item */
});
```

## When Not To Use It

This rule may not be suitable if:

- You're specifically testing random number generation
- You're using property-based testing with proper seeding
- You're testing systems that inherently work with random data
- You need to test with a large variety of inputs

In these cases:

```javascript
// Disable for legitimate randomness testing
// eslint-disable-next-line test-flakiness/no-random-data
const randomValue = Math.random();

// Or configure to allow seeded randomness
{
  "test-flakiness/no-random-data": ["error", {
    "allowSeededRandom": true,
    "allowInSetup": true
  }]
}
```

## Related Rules

- [no-global-state-mutation](./no-global-state-mutation.md) - Prevents unpredictable state changes
- [no-test-isolation](./no-test-isolation.md) - Ensures test independence
- [no-unconditional-wait](./no-unconditional-wait.md) - Prevents timing-dependent behavior

## Further Reading

- [Fast-Check - Property Based Testing](https://dubzzz.github.io/fast-check/)
- [Faker.js - Seeded Data Generation](https://fakerjs.dev/guide/seeding.html)
- [Jest - Deterministic Tests](https://jestjs.io/docs/snapshot-testing)
- [Property-Based Testing Principles](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Deterministic Testing Strategies](https://martinfowler.com/articles/nonDeterminism.html)
