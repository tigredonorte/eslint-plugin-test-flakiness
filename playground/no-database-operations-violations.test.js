/**
 * Examples of database operations that WILL be detected by the no-database-operations rule
 */

// Mock definitions to avoid no-undef errors
const User = { create: () => {}, update: () => {}, delete: () => {} };
const Post = { update: () => {}, delete: () => {} };
const Comment = { delete: () => {} };
const userModel = { save: () => {} };
const userRepository = { save: () => {}, remove: () => {} };
const postRepository = { remove: () => {} };
const orderRepository = { insert: () => {} };
const userData = {};
const orderData = {};
const postId = 1;
const db = { query: () => {} };
const connection = { execute: () => {} };
const database = { run: () => {} };
const collection = { insertOne: () => {} };
const users = { updateMany: () => {} };
const posts = { deleteOne: () => {} };
const prisma = {
  user: { create: () => {}, update: () => {}, deleteMany: () => {}, createMany: () => {}, upsert: () => {}, updateMany: () => {} },
  post: { update: () => {} },
  comment: { deleteMany: () => {} },
  customModel: { customOperation: () => {} }
};
const knex = () => ({ insert: () => {}, update: () => ({ where: () => {} }), del: () => ({ where: () => {} }) });
const sinon = { stub: () => ({ resolves: () => {} }) };
const UserService = class {};

// ✅ DETECTED: Direct ORM create operation
describe('ORM create operation', () => {
  it('detects User.create', async () => {
    // ESLint error: Avoid direct database create in tests
    await User.create({ name: 'John' });
  });
});

// ✅ DETECTED: Direct ORM save operation
describe('ORM save operation', () => {
  it('detects model.save', async () => {
    // ESLint error: Avoid direct database save in tests
    await userModel.save();
  });
});

// ✅ DETECTED: Direct ORM update operation
describe('ORM update operation', () => {
  it('detects Post.update', async () => {
    // ESLint error: Avoid direct database update in tests
    await Post.update({ id: 1 }, { title: 'Updated' });
  });
});

// ✅ DETECTED: Direct ORM delete operation
describe('ORM delete operation', () => {
  it('detects Comment.delete', async () => {
    // ESLint error: Avoid direct database delete in tests
    await Comment.delete({ id: 1 });
  });
});

// ✅ DETECTED: Repository save operation
test('repository save operation', async () => {
  // ESLint error: Repository operations are detected
  await userRepository.save(userData);
});

// ✅ DETECTED: Repository remove operation
test('repository remove operation', async () => {
  // ESLint error: Repository operations are detected
  await postRepository.remove(postId);
});

// ✅ DETECTED: Repository insert operation
test('repository insert operation', async () => {
  // ESLint error: Repository operations are detected
  await orderRepository.insert(orderData);
});

// ✅ DETECTED: Raw SQL INSERT query
it('detects SQL INSERT query', async () => {
  // ESLint error: Avoid raw SQL queries in tests
  await db.query('INSERT INTO users VALUES (?, ?)', [1, 'John']);
});

// ✅ DETECTED: Raw SQL DELETE query
it('detects SQL DELETE query', async () => {
  // ESLint error: Avoid raw SQL queries in tests
  await connection.execute('DELETE FROM posts WHERE id = ?', [postId]);
});

// ✅ DETECTED: Raw SQL UPDATE query
it('detects SQL UPDATE query', async () => {
  // ESLint error: Avoid raw SQL queries in tests
  await database.run('UPDATE comments SET approved = true');
});

// ✅ DETECTED: MongoDB insertOne operation
test('MongoDB insertOne', async () => {
  // ESLint error: MongoDB operations are detected
  await collection.insertOne({ name: 'John' });
});

// ✅ DETECTED: MongoDB updateMany operation
test('MongoDB updateMany', async () => {
  // ESLint error: MongoDB operations are detected
  await users.updateMany({ active: false }, { $set: { active: true } });
});

// ✅ DETECTED: MongoDB deleteOne operation
test('MongoDB deleteOne', async () => {
  // ESLint error: MongoDB operations are detected
  await posts.deleteOne({ id: postId });
});

// ✅ DETECTED: Prisma create operation
it('Prisma create', async () => {
  // ESLint error: Prisma operations are detected
  await prisma.user.create({ data: { name: 'John' } });
});

// ✅ DETECTED: Prisma update operation
it('Prisma update', async () => {
  // ESLint error: Prisma operations are detected
  await prisma.post.update({ where: { id: 1 }, data: { published: true } });
});

// ✅ DETECTED: Prisma deleteMany operation
it('Prisma deleteMany', async () => {
  // ESLint error: Prisma operations are detected
  await prisma.comment.deleteMany({ where: { postId: 1 } });
});

// ✅ DETECTED: Prisma createMany operation (covers line 102)
it('Prisma createMany', async () => {
  // ESLint error: Prisma createMany is detected via text pattern
  await prisma.user.createMany({ data: [{ name: 'John' }, { name: 'Jane' }] });
});

// ✅ DETECTED: Prisma upsert operation (covers line 102)
it('Prisma upsert', async () => {
  // ESLint error: Prisma upsert is detected via text pattern
  await prisma.user.upsert({ where: { id: 1 }, create: { name: 'John' }, update: { name: 'Jane' } });
});

// ✅ DETECTED: Prisma updateMany operation (covers line 102)
it('Prisma updateMany', async () => {
  // ESLint error: Prisma updateMany is detected via text pattern
  await prisma.user.updateMany({ where: { active: false }, data: { active: true } });
});

// ✅ DETECTED: Custom Prisma model operation (covers line 111)
it('Prisma custom model', async () => {
  // ESLint error: Prisma operations detected via full text pattern
  await prisma.customModel.customOperation({ data: { value: 'test' } });
});

// ✅ DETECTED: Knex insert operation
test('Knex insert', async () => {
  // ESLint error: Knex operations are detected
  await knex('users').insert({ name: 'John' });
});

// ✅ DETECTED: Knex update operation
test('Knex update', async () => {
  // ESLint error: Knex operations are detected
  await knex('posts').update({ title: 'New' }).where({ id: 1 });
});

// ✅ DETECTED: Knex delete operation
test('Knex delete', async () => {
  // ESLint error: Knex operations are detected
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
  it('uses proper mocking with jest.spyOn', async () => {
    // ✅ OK: Properly mocked with spy
    jest.spyOn(User, 'create').mockResolvedValue({ id: 1 });
    await User.create({ name: 'John' });
  });

  it('uses proper mocking with sinon stub', async () => {
    // ✅ OK: Stubbed with Sinon
    sinon.stub(userModel, 'save').resolves();
    await userModel.save();
  });

  it('uses proper mocking with jest.fn', async () => {
    // ✅ OK: Mocked implementation
    User.delete = jest.fn();
    await User.delete({ id: 1 });
  });

  it('uses mocked MongoDB operations', async () => {
    // ✅ OK: MongoDB operations with mock context (covers line 232)
    jest.spyOn(collection, 'insertOne').mockResolvedValue({});
    await collection.insertOne({ name: 'John' });
  });

  it('uses mocked Knex operations', async () => {
    // ✅ OK: Knex operations with mock context (covers line 269)
    const mockKnex = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue([1])
    });
    await mockKnex('users').insert({ name: 'John' });
  });

  it('uses mocked Prisma operations', async () => {
    // ✅ OK: Prisma operations with mock context (covers line 308)
    jest.spyOn(prisma.user, 'create').mockResolvedValue({ id: 1 });
    await prisma.user.create({ data: { name: 'John' } });
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