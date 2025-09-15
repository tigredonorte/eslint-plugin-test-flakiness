/**
 * Examples of no-database-operations rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Database Operations Violations', () => {
  // ❌ BAD: Direct MongoDB operations
  it('should not use direct MongoDB operations', async () => {
    const client = new MongoClient(uri);
    await client.connect();

    const database = client.db('testdb');
    const collection = database.collection('users');

    const result = await collection.insertOne({ name: 'John' });
    const user = await collection.findOne({ _id: result.insertedId });

    expect(user.name).toBe('John');

    await client.close();
  });

  // ❌ BAD: Direct PostgreSQL queries
  it('should not use direct PostgreSQL', async () => {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'testdb'
    });

    await client.connect();
    const result = await client.query('SELECT * FROM users WHERE id = $1', [1]);
    expect(result.rows[0]).toBeDefined();

    await client.query('INSERT INTO users (name) VALUES ($1)', ['Test User']);
    await client.end();
  });

  // ❌ BAD: MySQL operations
  it('should not use direct MySQL', (done) => {
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'test'
    });

    connection.connect();

    connection.query('SELECT * FROM users', (error, results) => {
      expect(results.length).toBeGreaterThan(0);
      connection.end();
      done();
    });
  });

  // ❌ BAD: Sequelize ORM operations
  it('should not use Sequelize without mocking', async () => {
    const user = await User.create({
      firstName: 'John',
      lastName: 'Doe'
    });

    const foundUser = await User.findByPk(user.id);
    expect(foundUser.firstName).toBe('John');

    await user.destroy();
  });

  // ❌ BAD: Mongoose operations
  it('should not use Mongoose without mocking', async () => {
    const user = new UserModel({
      name: 'Test User',
      email: 'test@example.com'
    });

    await user.save();

    const found = await UserModel.findById(user._id);
    expect(found.name).toBe('Test User');

    await UserModel.deleteOne({ _id: user._id });
  });

  // ❌ BAD: Redis operations
  it('should not use Redis without mocking', async () => {
    const redis = new Redis();

    await redis.set('key', 'value');
    const value = await redis.get('key');
    expect(value).toBe('value');

    await redis.del('key');
    redis.disconnect();
  });

  // ❌ BAD: SQLite operations
  it('should not use SQLite without mocking', (done) => {
    const db = new sqlite3.Database(':memory:');

    db.run('CREATE TABLE users (id INT, name TEXT)');
    db.run('INSERT INTO users VALUES (?, ?)', [1, 'John']);

    db.get('SELECT * FROM users WHERE id = ?', [1], (err, row) => {
      expect(row.name).toBe('John');
      db.close();
      done();
    });
  });

  // ❌ BAD: Prisma ORM operations
  it('should not use Prisma without mocking', async () => {
    const prisma = new PrismaClient();

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });

    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThan(0);

    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  // ❌ BAD: TypeORM operations
  it('should not use TypeORM without mocking', async () => {
    const userRepository = getRepository(User);

    const user = new User();
    user.firstName = 'John';
    user.lastName = 'Doe';

    await userRepository.save(user);

    const users = await userRepository.find();
    expect(users).toHaveLength(1);

    await userRepository.remove(user);
  });

  // ❌ BAD: Knex.js operations
  it('should not use Knex without mocking', async () => {
    const knex = require('knex')({
      client: 'pg',
      connection: process.env.DATABASE_URL
    });

    await knex('users').insert({ name: 'John' });
    const users = await knex('users').select('*');
    expect(users.length).toBeGreaterThan(0);

    await knex('users').where('name', 'John').del();
    await knex.destroy();
  });
});