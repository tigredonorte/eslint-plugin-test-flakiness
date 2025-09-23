# no-database-operations

Prevent direct database operations in tests that can cause interference between tests and lead to flaky test behavior.

## Rule Details

This rule helps identify and prevent direct database operations in test files that can lead to:

- Test interference due to shared database state
- Flaky tests that depend on database state from other tests
- Slow test execution due to actual database operations
- Difficulty in maintaining test data consistency

### ❌ Incorrect

```javascript
// Direct database operations in tests
it("should create a user", async () => {
  const user = await UserModel.create({ name: "John" }); // ❌ Direct DB operation
  expect(user.name).toBe("John");
});

it("should update product", async () => {
  await Product.update({ id: 1 }, { price: 99.99 }); // ❌ Direct DB operation
  const product = await Product.findOne({ id: 1 });
  expect(product.price).toBe(99.99);
});

test("delete all records", async () => {
  await db.query("DELETE FROM users"); // ❌ Raw SQL query
  const count = await User.count();
  expect(count).toBe(0);
});

it("should insert many documents", async () => {
  await collection.insertMany(documents); // ❌ MongoDB operation
  const results = await collection.find({}).toArray();
  expect(results).toHaveLength(documents.length);
});
```

### ✅ Correct

```javascript
// Using mocks instead of real database operations
it("should create a user", async () => {
  const mockUser = { id: 1, name: "John" };
  jest.spyOn(UserModel, "create").mockResolvedValue(mockUser); // ✅ Mocked

  const user = await UserModel.create({ name: "John" });
  expect(user.name).toBe("John");
});

// Using test data builders/factories
it("should update product", async () => {
  const product = buildProduct({ price: 99.99 }); // ✅ Test data builder
  jest.spyOn(Product, "update").mockResolvedValue(product);

  const result = await Product.update({ id: 1 }, { price: 99.99 });
  expect(result.price).toBe(99.99);
});

// Using in-memory database for tests
beforeAll(async () => {
  await setupInMemoryDatabase(); // ✅ Isolated test database
});

// Database operations in hooks with transactions (when allowed)
beforeEach(async () => {
  await db.transaction(async (trx) => {
    // ✅ Wrapped in transaction
    await trx("users").insert(testUsers);
  });
});

afterEach(async () => {
  await db.transaction(async (trx) => {
    // ✅ Proper cleanup
    await trx("users").del();
  });
});
```

## Options

This rule accepts an options object with the following properties:

### `allowInHooks` (default: `true`)

When set to `true`, database operations are allowed in setup/teardown hooks (`beforeAll`, `beforeEach`, `afterAll`, `afterEach`) but will suggest using transactions for proper cleanup.

```json
{
  "rules": {
    "test-flakiness/no-database-operations": [
      "error",
      {
        "allowInHooks": true
      }
    ]
  }
}
```

## Detected Patterns

This rule detects various database operation patterns:

### ORM Operations

- Sequelize: `Model.create()`, `Model.update()`, `Model.destroy()`
- TypeORM: `Repository.save()`, `Repository.remove()`, `Repository.delete()`
- Mongoose: `Model.save()`, `Model.create()`, `Model.updateOne()`
- Prisma: `prisma.user.create()`, `prisma.post.update()`

### Raw SQL Queries

- Direct SQL execution: `db.query('INSERT INTO...')`, `connection.execute('DELETE...')`
- Query builders with raw SQL

### MongoDB Operations

- Native driver: `collection.insertOne()`, `collection.updateMany()`, `collection.deleteOne()`
- Mongoose operations

### Query Builders

- Knex.js: `knex('users').insert()`, `knex('posts').update()`, `knex('items').del()`

## When Not To Use It

This rule should be disabled when:

1. **Integration Tests**: You're writing integration tests that specifically need to test database interactions
2. **E2E Tests**: End-to-end tests that test the full application stack
3. **Database Migration Tests**: Tests that verify database migrations work correctly
4. **Performance Tests**: Tests that measure database query performance

In these cases, you can disable the rule for specific files:

```javascript
/* eslint-disable test-flakiness/no-database-operations */

// Integration test file
describe("User Repository Integration", () => {
  it("should persist user to database", async () => {
    // Actual database operations are intentional here
    const user = await UserRepository.create({ name: "John" });
    const found = await UserRepository.findById(user.id);
    expect(found).toEqual(user);
  });
});
```

## Best Practices

1. **Use Mocks**: Mock database operations in unit tests
2. **Test Data Builders**: Create test data builders or factories for consistent test data
3. **In-Memory Databases**: Use in-memory databases (like SQLite) for tests when database behavior needs to be tested
4. **Transactions**: When database operations are necessary in tests, wrap them in transactions that can be rolled back
5. **Isolated Test Databases**: Use separate database instances for each test suite or use database sandboxing
6. **Cleanup Hooks**: Always clean up test data in `afterEach` or `afterAll` hooks

## Related Rules

- [no-shared-state](./no-shared-state.md) - Prevent shared state between tests
- [proper-test-isolation](./proper-test-isolation.md) - Ensure proper test isolation

## Known Limitations

This rule prioritizes accuracy over exhaustive detection to avoid false positives. The following patterns will **not** be detected:

### Destructured Operations

```javascript
// Won't be detected
const { create, update, delete: deleteUser } = User;
await create({ name: "John" });
```

### Custom Wrapper Functions

```javascript
// Won't be detected
async function createUser(data) {
  return await User.create(data); // This would be detected if in the wrapper file
}
await createUser({ name: "John" });
```

### Dynamic Property Access

```javascript
// Won't be detected
const method = "create";
await User[method]({ name: "John" });
```

### Service Layer Abstractions

```javascript
// Won't be detected unless service name matches patterns
const userService = new UserService();
await userService.createUser({ name: "John" });
```

These limitations are **intentional design decisions** to prevent false positives in legitimate abstractions and service layers.

## Performance Considerations

The rule performs multiple regex checks per `CallExpression`:

1. ORM method name matching
2. Object text pattern recognition
3. SQL keyword detection in strings
4. Framework-specific pattern matching (Prisma, Knex, MongoDB)

This is acceptable because:

- **Accuracy is prioritized** over micro-optimization
- ESLint runs during development/CI, not production runtime
- Modern JavaScript engines highly optimize regex operations
- Early bailout patterns minimize unnecessary work

## Further Reading

- [Testing Best Practices - Database Testing](https://testingjavascript.com/)
- [Mocking Database Operations](https://jestjs.io/docs/mock-functions)
- [Test Data Builders Pattern](https://www.martinfowler.com/bliki/ObjectMother.html)
- [Database Testing Strategies](https://www.testim.io/blog/database-testing/)
