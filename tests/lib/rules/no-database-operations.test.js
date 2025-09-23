/**
 * @fileoverview Tests for no-database-operations rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-database-operations');
const { RuleTester } = require('eslint');
const semver = require('semver');

// Detect ESLint version for proper RuleTester configuration
const eslintPackage = require('eslint/package.json');
const eslintVersion = semver.major(eslintPackage.version);

// Configure RuleTester based on ESLint version
const ruleTesterConfig = eslintVersion >= 9
  ? {
      // ESLint 9+ (flat config)
      languageOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    }
  : {
      // ESLint 7-8 (legacy config)
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    };

const ruleTester = new RuleTester(ruleTesterConfig);

ruleTester.run('no-database-operations', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'User.create({ name: "John" })',
      filename: 'src/services/user.js'
    },
    {
      code: 'db.query("SELECT * FROM users")',
      filename: 'src/database/queries.js'
    },

    // Properly mocked contexts with actual spies/stubs
    {
      code: 'jest.spyOn(User, "create").mockResolvedValue({}); User.create({ name: "John" })',
      filename: 'User.test.js'
    },
    {
      code: 'const mockInsert = vi.fn(); db.insert = mockInsert; db.insert(data)',
      filename: 'Database.test.js'
    },
    {
      code: 'sinon.stub(userModel, "save"); userModel.save()',
      filename: 'User.spec.js'
    },
    {
      code: 'td.replace(database, "query"); database.query("test data")',
      filename: 'Query.test.js'
    },

    // Non-database method names
    {
      code: 'component.save()',
      filename: 'Component.test.js'
    },
    {
      code: 'localStorage.save(data)',
      filename: 'Storage.test.js'
    },
    {
      code: 'file.create()',
      filename: 'File.test.js'
    },
    {
      code: 'myArray.remove(index)',
      filename: 'Array.test.js'
    },

    // Reading operations are generally okay
    {
      code: 'User.find({ id: 1 })',
      filename: 'User.test.js'
    },
    {
      code: 'Model.findOne({ name: "test" })',
      filename: 'Model.test.js'
    },
    {
      code: 'db.select("*").from("users")',
      filename: 'Query.test.js'
    },

    // In setup/teardown with proper mocking
    {
      code: 'beforeEach(() => { jest.spyOn(User, "create"); User.create({ name: "test" }) })',
      filename: 'Setup.test.js'
    },
    {
      code: 'afterEach(() => { User.delete = jest.fn(); User.delete({ id: 1 }) })',
      filename: 'Cleanup.test.js'
    },

    // Non-SQL string arguments
    {
      code: 'logger.query("What is your name?")',
      filename: 'Logger.test.js'
    },
    {
      code: 'api.execute("fetchData")',
      filename: 'Api.test.js'
    },
    {
      code: 'command.run("npm test")',
      filename: 'Command.test.js'
    },

    // Variable SQL (harder to detect)
    {
      code: 'const sql = "SELECT * FROM users"; db.query(sql)',
      filename: 'Variable.test.js'
    },
    {
      code: 'db.query(getSqlQuery())',
      filename: 'Function.test.js'
    }
  ],

  invalid: [
    // ORM operations - Create
    {
      code: 'User.create({ name: "John" })',
      filename: 'User.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'create' }
      }]
    },
    {
      code: 'UserModel.create({ email: "test@example.com" })',
      filename: 'UserModel.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'create' }
      }]
    },
    {
      code: 'repository.create(entity)',
      filename: 'Repository.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'create' }
      }]
    },

    // ORM operations - Save with model/repository patterns
    {
      code: 'userModel.save()',
      filename: 'User.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'save' }
      }]
    },
    {
      code: 'model.save()',
      filename: 'Model.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'save' }
      }]
    },
    {
      code: 'entity.save()',
      filename: 'Entity.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'save' }
      }]
    },

    // ORM operations - Update
    {
      code: 'User.update({ name: "Jane" }, { where: { id: 1 } })',
      filename: 'User.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'update' }
      }]
    },
    {
      code: 'Post.updateOrCreate({ id: 1 }, { title: "New" })',
      filename: 'Post.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'updateOrCreate' }
      }]
    },

    // ORM operations - Delete
    {
      code: 'User.delete({ id: 1 })',
      filename: 'User.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'delete' }
      }]
    },
    {
      code: 'Comment.destroy({ where: { id: 1 } })',
      filename: 'Comment.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'destroy' }
      }]
    },
    {
      code: 'Order.remove({ id: 1 })',
      filename: 'Order.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'remove' }
      }]
    },

    // Bulk operations
    {
      code: 'User.bulkCreate(users)',
      filename: 'User.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'bulkCreate' }
      }]
    },
    {
      code: 'Product.bulkUpdate(updates)',
      filename: 'Product.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'bulkUpdate' }
      }]
    },
    {
      code: 'Customer.bulkDelete(ids)',
      filename: 'Customer.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'bulkDelete' }
      }]
    },

    // Other ORM methods
    {
      code: 'User.increment("loginCount", { where: { id: 1 } })',
      filename: 'User.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'increment' }
      }]
    },
    {
      code: 'Product.decrement("stock", { where: { id: 1 } })',
      filename: 'Product.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'decrement' }
      }]
    },
    {
      code: 'User.findOrCreate({ where: { email: "test@example.com" } })',
      filename: 'User.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'findOrCreate' }
      }]
    },
    {
      code: 'Model.upsert(data)',
      filename: 'Model.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'upsert' }
      }]
    },

    // Database sync/migrate operations
    {
      code: 'db.sync()',
      filename: 'Database.test.js',
      errors: [{
        messageId: 'needsIsolation'
      }]
    },
    {
      code: 'database.migrate()',
      filename: 'Migration.test.js',
      errors: [{
        messageId: 'needsIsolation'
      }]
    },
    {
      code: 'db.seed()',
      filename: 'Seed.test.js',
      errors: [{
        messageId: 'needsIsolation'
      }]
    },

    // Raw SQL queries
    {
      code: 'db.query("INSERT INTO users (name) VALUES (?)", ["John"])',
      filename: 'Query.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'database.execute("UPDATE users SET name = ? WHERE id = ?", ["Jane", 1])',
      filename: 'Execute.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'connection.run("DELETE FROM users WHERE id = ?", [1])',
      filename: 'Delete.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'db.exec("CREATE TABLE test (id INT)")',
      filename: 'Create.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'database.query("DROP TABLE users")',
      filename: 'Drop.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'db.query("TRUNCATE TABLE users")',
      filename: 'Truncate.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'connection.execute("BEGIN TRANSACTION")',
      filename: 'Transaction.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },

    // Template literal SQL
    {
      code: 'db.query(`SELECT * FROM users WHERE id = ${userId}`)',
      filename: 'Template.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'database.execute(`INSERT INTO posts (title) VALUES ("${title}")`)',
      filename: 'TemplateInsert.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'conn.run(`UPDATE users SET name = "${name}"`)',
      filename: 'TemplateUpdate.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },
    {
      code: 'db.query(`DELETE FROM comments WHERE id = ${id}`)',
      filename: 'TemplateDelete.test.js',
      errors: [{
        messageId: 'avoidRawQuery'
      }]
    },

    // MongoDB operations
    {
      code: 'collection.insertOne({ name: "John" })',
      filename: 'Mongo.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'insertOne' }
      }]
    },
    {
      code: 'users.insertMany([{ name: "John" }, { name: "Jane" }])',
      filename: 'MongoInsert.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'insertMany' }
      }]
    },
    {
      code: 'collection.updateOne({ id: 1 }, { $set: { name: "Jane" } })',
      filename: 'MongoUpdate.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'updateOne' }
      }]
    },
    {
      code: 'posts.updateMany({}, { $inc: { views: 1 } })',
      filename: 'MongoUpdateMany.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'updateMany' }
      }]
    },
    {
      code: 'collection.deleteOne({ id: 1 })',
      filename: 'MongoDelete.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'deleteOne' }
      }]
    },
    {
      code: 'users.deleteMany({ inactive: true })',
      filename: 'MongoDeleteMany.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'deleteMany' }
      }]
    },
    {
      code: 'collection.replaceOne({ id: 1 }, newDoc)',
      filename: 'MongoReplace.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'replaceOne' }
      }]
    },
    {
      code: 'users.findOneAndUpdate({ id: 1 }, { $set: { name: "New" } })',
      filename: 'MongoFindUpdate.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'findOneAndUpdate' }
      }]
    },
    {
      code: 'collection.findOneAndDelete({ id: 1 })',
      filename: 'MongoFindDelete.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'findOneAndDelete' }
      }]
    },
    {
      code: 'users.findOneAndReplace({ id: 1 }, newUser)',
      filename: 'MongoFindReplace.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'findOneAndReplace' }
      }]
    },
    {
      code: 'collection.bulkWrite(operations)',
      filename: 'MongoBulk.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'bulkWrite' }
      }]
    },

    // Knex operations
    {
      code: 'knex("users").insert({ name: "John" })',
      filename: 'Knex.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Knex operation' }
      }]
    },
    {
      code: 'knex("posts").update({ title: "New" }).where({ id: 1 })',
      filename: 'KnexUpdate.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Knex operation' }
      }]
    },
    {
      code: 'knex("comments").del().where({ id: 1 })',
      filename: 'KnexDelete.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Knex operation' }
      }]
    },
    {
      code: 'knex("users").truncate()',
      filename: 'KnexTruncate.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Knex operation' }
      }]
    },

    // Prisma operations
    {
      code: 'prisma.user.create({ data: { name: "John" } })',
      filename: 'Prisma.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Prisma operation' }
      }]
    },
    {
      code: 'prisma.post.update({ where: { id: 1 }, data: { title: "New" } })',
      filename: 'PrismaUpdate.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Prisma operation' }
      }]
    },
    {
      code: 'prisma.comment.delete({ where: { id: 1 } })',
      filename: 'PrismaDelete.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Prisma operation' }
      }]
    },
    {
      code: 'prisma.user.upsert({ where: { email: "test@example.com" }, create: data, update: data })',
      filename: 'PrismaUpsert.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Prisma operation' }
      }]
    },
    {
      code: 'prisma.user.createMany({ data: users })',
      filename: 'PrismaCreateMany.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Prisma operation' }
      }]
    },
    {
      code: 'prisma.post.updateMany({ where: { published: false }, data: { published: true } })',
      filename: 'PrismaUpdateMany.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Prisma operation' }
      }]
    },
    {
      code: 'prisma.comment.deleteMany({ where: { postId: 1 } })',
      filename: 'PrismaDeleteMany.test.js',
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'Prisma operation' }
      }]
    },

    // In setup hooks with allowInHooks: true (warns differently)
    {
      code: 'beforeEach(() => { User.create({ name: "test" }) })',
      filename: 'Setup.test.js',
      options: [{ allowInHooks: true }],
      errors: [{
        messageId: 'useTransaction',
        data: { operation: 'create' }
      }]
    },
    {
      code: 'afterEach(() => { User.delete({ id: 1 }) })',
      filename: 'Cleanup.test.js',
      options: [{ allowInHooks: true }],
      errors: [{
        messageId: 'useTransaction',
        data: { operation: 'delete' }
      }]
    },

    // In setup hooks with allowInHooks: false
    {
      code: 'beforeEach(() => { User.create({ name: "test" }) })',
      filename: 'Setup.test.js',
      options: [{ allowInHooks: false }],
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'create' }
      }]
    },
    {
      code: 'afterAll(() => { database.truncate() })',
      filename: 'Cleanup.test.js',
      options: [{ allowInHooks: false }],
      errors: [{
        messageId: 'avoidDbOperation',
        data: { operation: 'truncate' }
      }]
    },

    // Multiple violations
    {
      code: `
        User.create({ name: "John" });
        Post.update({ title: "New" }, { where: { id: 1 } });
        Comment.delete({ id: 1 });
        db.query("INSERT INTO logs (message) VALUES (?)", ["test"]);
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidDbOperation', data: { operation: 'create' } },
        { messageId: 'avoidDbOperation', data: { operation: 'update' } },
        { messageId: 'avoidDbOperation', data: { operation: 'delete' } },
        { messageId: 'avoidRawQuery' }
      ]
    }
  ]
});

// Unit tests for helper functions
describe('no-database-operations rule internals', () => {
  it('should export a rule object', () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeDefined();
  });

  it('should have correct meta information', () => {
    expect(rule.meta.type).toBe('problem');
    expect(rule.meta.docs.description).toBe('Prevent direct database operations that can interfere between tests');
    expect(rule.meta.fixable).toBe(null);
    expect(rule.meta.messages).toHaveProperty('avoidDbOperation');
    expect(rule.meta.messages).toHaveProperty('useTransaction');
    expect(rule.meta.messages).toHaveProperty('avoidRawQuery');
    expect(rule.meta.messages).toHaveProperty('needsIsolation');
  });

  it('should have schema with correct options', () => {
    expect(rule.meta.schema).toHaveLength(1);
    expect(rule.meta.schema[0].type).toBe('object');
    expect(rule.meta.schema[0].properties).toHaveProperty('allowInHooks');
    expect(rule.meta.schema[0].properties.allowInHooks.type).toBe('boolean');
    expect(rule.meta.schema[0].properties.allowInHooks.default).toBe(true);
  });

  it('should return empty object for non-test files', () => {
    const context = {
      options: [],
      filename: 'app.js',
      getFilename: () => 'app.js',
      report: jest.fn()
    };

    const visitor = rule.create(context);
    expect(visitor).toEqual({});
  });

  it('should create proper visitor for test files', () => {
    const context = {
      options: [],
      filename: 'test.spec.js',
      getFilename: () => 'test.spec.js',
      report: jest.fn(),
      getSourceCode: () => ({
        getText: () => 'code'
      })
    };

    const visitor = rule.create(context);
    expect(visitor).toBeDefined();
    expect(visitor.CallExpression).toBeDefined();
  });

  describe('Edge cases', () => {
    it('should handle CallExpression without callee properties', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {},
        arguments: [],
        parent: null
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle MemberExpression without property name', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'UserModel' },
          property: {}
        },
        arguments: [],
        parent: null
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle empty options', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      expect(visitor).toBeDefined();
    });

    it('should handle options without allowInHooks', () => {
      const context = {
        options: [{}],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      expect(visitor).toBeDefined();
    });

    it('should handle query with non-literal first argument', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'db' },
          property: { name: 'query' }
        },
        arguments: [{ type: 'Identifier', name: 'sqlQuery' }],
        parent: null
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle query with non-string literal', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'db' },
          property: { name: 'query' }
        },
        arguments: [{ type: 'Literal', value: 123 }],
        parent: null
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle query with empty arguments', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'db' },
          property: { name: 'query' }
        },
        arguments: [],
        parent: null
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle non-MemberExpression callee for Knex', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'knex.insert()'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'knex'
        },
        arguments: [],
        parent: null
      };

      visitor.CallExpression(node);
      // Should still check the text pattern
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle setup/teardown detection through parent chain', () => {
      const context = {
        options: [{ allowInHooks: true }],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'UserModel'
        })
      };

      const visitor = rule.create(context);

      // Test with beforeEach in parent chain
      const nodeInBeforeEach = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'UserModel' },
          property: { name: 'create' }
        },
        arguments: [],
        parent: {
          parent: {
            parent: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'beforeEach'
              }
            }
          }
        }
      };

      visitor.CallExpression(nodeInBeforeEach);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'useTransaction'
        })
      );

      // Test with afterAll in parent chain
      context.report.mockClear();
      const nodeInAfterAll = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'UserModel' },
          property: { name: 'delete' }
        },
        arguments: [],
        parent: {
          parent: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'afterAll'
            }
          }
        }
      };

      visitor.CallExpression(nodeInAfterAll);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'useTransaction'
        })
      );
    });

    it('should handle parent chain without CallExpression', () => {
      const context = {
        options: [{ allowInHooks: true }],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'UserModel'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'UserModel' },
          property: { name: 'create' }
        },
        arguments: [],
        parent: {
          type: 'VariableDeclarator',
          parent: null
        }
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'avoidDbOperation'
        })
      );
    });

    it('should handle parent chain with non-Identifier callee', () => {
      const context = {
        options: [{ allowInHooks: true }],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'UserModel'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'UserModel' },
          property: { name: 'create' }
        },
        arguments: [],
        parent: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            property: { name: 'call' }
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'avoidDbOperation'
        })
      );
    });
  });
});