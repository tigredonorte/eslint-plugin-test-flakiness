/**
 * @fileoverview Tests for no-database-operations rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-database-operations');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

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

    // Mocked contexts
    {
      code: 'jest.mock("./models"); User.create({ name: "John" })',
      filename: 'User.test.js'
    },
    {
      code: 'vi.mock("./database"); db.insert(data)',
      filename: 'Database.test.js'
    },
    {
      code: 'sinon.stub(UserModel, "save"); user.save()',
      filename: 'User.spec.js'
    },
    {
      code: 'td.replace(database, "query"); database.query("SELECT * FROM users")',
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
      code: 'array.delete(index)',
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

    // In setup/teardown with allowInHooks: true (default)
    {
      code: 'beforeEach(() => { jest.mock("./models"); User.create({ name: "test" }) })',
      filename: 'Setup.test.js'
    },
    {
      code: 'afterEach(() => { jest.mock("./models"); User.delete({ id: 1 }) })',
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

    // ORM operations - Save
    {
      code: 'user.save()',
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
        data: { operation: 'Knex operation' }
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