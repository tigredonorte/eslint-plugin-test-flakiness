/**
 * Examples of database operations that WILL be detected by the no-database-operations rule
 */

/* eslint-disable no-undef, no-unused-vars */

// ✅ DETECTED: Direct ORM operations
describe('User Service', () => {
  it('creates a user', async () => {
    // ESLint error: Avoid direct database create in tests
    const user = await User.create({ name: 'John' });

    // ESLint error: Avoid direct database save in tests
    await userModel.save();

    // ESLint error: Avoid direct database update in tests
    await Post.update({ id: 1 }, { title: 'Updated' });

    // ESLint error: Avoid direct database delete in tests
    await Comment.delete({ id: 1 });
  });
});

// ✅ DETECTED: Repository pattern operations
test('repository operations', async () => {
  // ESLint error: Repository operations are detected
  await userRepository.save(userData);
  await postRepository.remove(postId);
  await orderRepository.insert(orderData);
});

// ✅ DETECTED: Raw SQL queries
it('runs SQL queries', async () => {
  // ESLint error: Avoid raw SQL queries in tests
  await db.query('INSERT INTO users VALUES (?, ?)', [1, 'John']);
  await connection.execute('DELETE FROM posts WHERE id = ?', [postId]);
  await database.run('UPDATE comments SET approved = true');
});

// ✅ DETECTED: MongoDB operations
test('MongoDB operations', async () => {
  // ESLint error: MongoDB operations are detected
  await collection.insertOne({ name: 'John' });
  await users.updateMany({ active: false }, { $set: { active: true } });
  await posts.deleteOne({ id: postId });
});

// ✅ DETECTED: Prisma operations
it('uses Prisma ORM', async () => {
  // ESLint error: Prisma operations are detected
  await prisma.user.create({ data: { name: 'John' } });
  await prisma.post.update({ where: { id: 1 }, data: { published: true } });
  await prisma.comment.deleteMany({ where: { postId: 1 } });
});

// ✅ DETECTED: Knex.js query builder
test('Knex operations', async () => {
  // ESLint error: Knex operations are detected
  await knex('users').insert({ name: 'John' });
  await knex('posts').update({ title: 'New' }).where({ id: 1 });
  await knex('comments').del().where({ id: 1 });
});

// ✅ DETECTED: Operations in test hooks (with warnings)
beforeEach(async () => {
  // ESLint warning: Database operations should be wrapped in transactions
  await User.create({ name: 'TestUser' });
});

afterEach(async () => {
  // ESLint warning: Database operations should be wrapped in transactions
  await User.delete({ where: {} });
});

// ✅ PROPERLY MOCKED: These are acceptable
describe('Mocked operations', () => {
  it('uses proper mocking', async () => {
    // ✅ OK: Properly mocked with spy
    jest.spyOn(User, 'create').mockResolvedValue({ id: 1 });
    await User.create({ name: 'John' });

    // ✅ OK: Stubbed with Sinon
    sinon.stub(userModel, 'save').resolves();
    await userModel.save();

    // ✅ OK: Mocked implementation
    User.delete = jest.fn();
    await User.delete({ id: 1 });
  });
});

/**
 * Examples of patterns that WON'T be detected (known limitations)
 */
describe('Limitations', () => {
  it('destructured operations not detected', async () => {
    // ❌ NOT DETECTED: Destructured operations
    const { create, update, delete: deleteUser } = User;
    await create({ name: 'John' }); // Won't be detected
    await update({ id: 1 }, { name: 'Jane' }); // Won't be detected
    await deleteUser({ id: 1 }); // Won't be detected
  });

  it('custom wrapper functions not detected', async () => {
    // ❌ NOT DETECTED: Custom wrapper functions
    async function createUser(data) {
      return await User.create(data); // This line would be detected if in test file
    }
    await createUser({ name: 'John' }); // But this call won't be detected
  });
  it('dynamic methods not detected', async () => {
    // ❌ NOT DETECTED: Dynamically accessed methods
    const method = 'create';
    await User[method]({ name: 'John' }); // Won't be detected
  });

  it('service layer operations not detected', async () => {
    // ❌ NOT DETECTED: Database operations through service layers
    const userService = new UserService();
    await userService.createUser({ name: 'John' }); // Won't be detected unless 'userService' matches patterns
  });

  it('indirect promise operations', async () => {
    // ❌ NOT DETECTED: Indirect operations through promises
    const operations = [
      User.create({ name: 'John' }),
      Post.update({ id: 1 }, { title: 'New' })
    ];
    await Promise.all(operations); // The operations themselves would be detected, but not if abstracted
  });

  it('aliased operations not detected', async () => {
    // ❌ NOT DETECTED: Operations through aliases that don't match patterns
    const myCustomDb = database;
    await myCustomDb.query('INSERT INTO users...'); // Won't be detected unless 'myCustomDb' contains 'db'
  });
});

/**
 * Performance considerations:
 *
 * The rule performs multiple regex checks per CallExpression:
 * 1. Check for ORM method names (save, create, update, etc.)
 * 2. Check object text for database-related patterns
 * 3. Check for SQL keywords in query strings
 * 4. Check for specific ORM patterns (Prisma, Knex, MongoDB)
 *
 * This is acceptable because:
 * - Accuracy is more important than micro-optimization
 * - ESLint runs during development/CI, not production
 * - Regex operations are highly optimized in JavaScript engines
 * - The patterns are tested early and bail out quickly for non-matches
 */