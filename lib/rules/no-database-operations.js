/**
 * @fileoverview Rule to prevent direct database operations in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent direct database operations that can interfere between tests',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-database-operations.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowInHooks: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidDbOperation: 'Avoid direct database {{operation}} in tests. Use mocks or test fixtures.',
      useTransaction: 'Database operations should be wrapped in transactions for proper cleanup.',
      avoidRawQuery: 'Avoid raw SQL queries in tests. Use test data builders or factories.',
      needsIsolation: 'Database operations need proper test isolation.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowInHooks = options.allowInHooks !== false;

    function isInSetupTeardown(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression' &&
            parent.callee.type === 'Identifier') {
          const name = parent.callee.name;
          if (/^(before|after)(Each|All)$/.test(name)) {
            return true;
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    function checkORMOperations(node) {
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        const sourceCode = context.getSourceCode();
        const objectText = sourceCode.getText(node.callee.object);
        
        // Common ORM methods that modify data
        const dbMethods = [
          'save', 'create', 'update', 'delete', 'destroy', 'remove',
          'insert', 'upsert', 'bulkCreate', 'bulkUpdate', 'bulkDelete',
          'findOrCreate', 'updateOrCreate', 'increment', 'decrement'
        ];
        
        if (dbMethods.includes(method)) {
          // Check if it's likely a database model
          if (/model|Model|db|DB|repository|Repository|entity|Entity/.test(objectText) ||
              /User|Post|Comment|Order|Product|Customer/.test(objectText)) {
            
            if (!isInMockContext(node, context)) {
              if (allowInHooks && isInSetupTeardown(node)) {
                // Warn about cleanup needs
                context.report({
                  node,
                  messageId: 'useTransaction',
                  data: { operation: method }
                });
              } else {
                context.report({
                  node,
                  messageId: 'avoidDbOperation',
                  data: { operation: method }
                });
              }
            }
          }
        }
        
        // Check for Sequelize/TypeORM/Mongoose specific patterns
        if (method === 'sync' || method === 'migrate' || method === 'seed') {
          context.report({
            node,
            messageId: 'needsIsolation'
          });
        }
      }
    }

    function checkSQLQueries(node) {
      // Check for raw SQL query execution
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        // const obj = node.callee.object;
        
        // Common query execution methods
        const queryMethods = ['query', 'execute', 'exec', 'run', 'all', 'get'];
        
        if (queryMethods.includes(method)) {
          // Check if first argument looks like SQL
          const firstArg = node.arguments[0];
          if (firstArg && firstArg.type === 'Literal') {
            const value = firstArg.value;
            if (typeof value === 'string') {
              const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|BEGIN|COMMIT|ROLLBACK)\b/i;
              if (sqlKeywords.test(value)) {
                context.report({
                  node,
                  messageId: 'avoidRawQuery'
                });
              }
            }
          }
          
          // Check for template literal SQL
          if (firstArg && firstArg.type === 'TemplateLiteral') {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(firstArg);
            if (/SELECT|INSERT|UPDATE|DELETE/i.test(text)) {
              context.report({
                node,
                messageId: 'avoidRawQuery'
              });
            }
          }
        }
      }
    }

    function checkMongoOperations(node) {
      // Check for MongoDB operations
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        const mongoMethods = [
          'insertOne', 'insertMany', 'updateOne', 'updateMany',
          'deleteOne', 'deleteMany', 'replaceOne', 'findOneAndUpdate',
          'findOneAndDelete', 'findOneAndReplace', 'bulkWrite'
        ];
        
        if (mongoMethods.includes(method)) {
          if (!isInMockContext(node, context)) {
            context.report({
              node,
              messageId: 'avoidDbOperation',
              data: { operation: method }
            });
          }
        }
      }
    }

    function checkKnexOperations(node) {
      // Check for Knex.js query builder
      if (node.callee.type === 'MemberExpression' ||
          node.callee.type === 'CallExpression') {
        
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText(node);
        
        // Knex chain patterns
        if (/\.(insert|update|del|delete|truncate)\(/.test(text)) {
          if (!isInMockContext(node, context)) {
            context.report({
              node,
              messageId: 'avoidDbOperation',
              data: { operation: 'Knex operation' }
            });
          }
        }
      }
    }

    function checkPrismaOperations(node) {
      // Check for Prisma operations
      if (node.callee.type === 'MemberExpression') {
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText(node);
        
        // Prisma patterns like prisma.user.create()
        if (/prisma\.\w+\.(create|update|delete|upsert|createMany|updateMany|deleteMany)/.test(text)) {
          if (!isInMockContext(node, context)) {
            context.report({
              node,
              messageId: 'avoidDbOperation',
              data: { operation: 'Prisma operation' }
            });
          }
        }
      }
    }

    return {
      CallExpression(node) {
        checkORMOperations(node);
        checkSQLQueries(node);
        checkMongoOperations(node);
        checkKnexOperations(node);
        checkPrismaOperations(node);
      }
    };
  }
};
