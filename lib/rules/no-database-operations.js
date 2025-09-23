/**
 * @fileoverview Rule to prevent direct database operations in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext, getFilename } = require('../utils/helpers');

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
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
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
        const method = node.callee.property && node.callee.property.name;
        if (!method) return;

        const sourceCode = context.getSourceCode();
        const objectText = sourceCode.getText(node.callee.object);

        // Common ORM methods that modify data
        const dbMethods = [
          'save', 'create', 'update', 'delete', 'destroy', 'remove',
          'insert', 'upsert', 'bulkCreate', 'bulkUpdate', 'bulkDelete',
          'findOrCreate', 'updateOrCreate', 'increment', 'decrement', 'truncate'
        ];

        if (dbMethods.includes(method)) {
          // Skip if this is a Prisma operation (handled by checkPrismaOperations)
          let current = node.callee.object;
          let isPrismaOperation = false;
          if (current && current.type === 'MemberExpression' &&
              current.object && current.object.name === 'prisma') {
            isPrismaOperation = true;
          }

          // Also skip Prisma-specific methods even if not detected as Prisma pattern
          const prismaSpecificMethods = ['createMany', 'updateMany', 'deleteMany', 'upsert'];
          if (prismaSpecificMethods.includes(method)) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(node);
            if (/^prisma\.\w+\./.test(text)) {
              isPrismaOperation = true;
            }
          }

          // Additional check - if the full call text starts with prisma., skip it
          if (!isPrismaOperation) {
            const sourceCode = context.getSourceCode();
            const fullText = sourceCode.getText(node);
            if (/^prisma\./.test(fullText)) {
              isPrismaOperation = true;
            }
          }

          if (!isPrismaOperation) {
            // Check if it's likely a database model
            // Avoid matching generic names like 'user', 'array', etc.
            const isDbObject = (
              // Match common database object patterns (case-insensitive)
              /(model|db|database|repository|entity|collection)/i.test(objectText) ||
              // Match common model names (exact match at start of object name)
              /^(User|Post|Comment|Order|Product|Customer|Account|Profile|Article|Category|Tag|Role|Permission|Session)(Model|Repository|Entity|Collection|Service)?$/i.test(objectText) ||
              // Match patterns ending with Model, Repository, etc.
              /(Model|Repository|Entity|Collection|Service)$/i.test(objectText)
            );

            if (isDbObject) {
              if (!isInMockContext(node, context)) {
                if (allowInHooks && isInSetupTeardown(node)) {
                  // Warn about cleanup needs
                  safeReport(node, {
                    node,
                    messageId: 'useTransaction',
                    data: { operation: method }
                  });
                } else {
                  safeReport(node, {
                    node,
                    messageId: 'avoidDbOperation',
                    data: { operation: method }
                  });
                }
              }
            }
          }
        }
        
        // Check for Sequelize/TypeORM/Mongoose specific patterns
        if (method === 'sync' || method === 'migrate' || method === 'seed') {
          safeReport(node, {
            node,
            messageId: 'needsIsolation'
          });
        }
      }
    }

    function checkSQLQueries(node) {
      // Check for raw SQL query execution
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property && node.callee.property.name;
        if (!method) return;

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
                safeReport(node, {
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
              safeReport(node, {
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
        const method = node.callee.property && node.callee.property.name;
        if (!method) return;
        
        const mongoMethods = [
          'insertOne', 'insertMany', 'updateOne', 'updateMany',
          'deleteOne', 'deleteMany', 'replaceOne', 'findOneAndUpdate',
          'findOneAndDelete', 'findOneAndReplace', 'bulkWrite'
        ];
        
        if (mongoMethods.includes(method)) {
          if (!isInMockContext(node, context)) {
            safeReport(node, {
              node,
              messageId: 'avoidDbOperation',
              data: { operation: method }
            });
          }
        }
      }
    }

    function checkKnexOperations(node) {
      // Check for Knex.js query builder - only report on the specific method call
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property && node.callee.property.name;
        if (!method) return;

        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText(node);

        // Knex modifying methods
        const knexMethods = ['insert', 'update', 'del', 'delete', 'truncate'];

        if (knexMethods.includes(method)) {
          // Check if this is part of a knex query chain
          if (/knex\(["']?\w+["']?\)/.test(text)) {
            if (!isInMockContext(node, context)) {
              safeReport(node, {
                node,
                messageId: 'avoidDbOperation',
                data: { operation: 'Knex operation' }
              });
            }
          }
        }
      }
    }

    function checkPrismaOperations(node) {
      // Check for Prisma operations - only report on the specific method call
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property && node.callee.property.name;
        if (!method) return;

        // Prisma modifying methods
        const prismaMethods = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];

        if (prismaMethods.includes(method)) {
          // Check if this is a prisma operation by examining the call chain
          let current = node.callee.object;

          // Look for prisma.model.method() pattern
          if (current.type === 'MemberExpression' &&
              current.object &&
              current.object.name === 'prisma') {
            if (!isInMockContext(node, context)) {
              safeReport(node, {
                node,
                messageId: 'avoidDbOperation',
                data: { operation: 'Prisma operation' }
              });
            }
          }
        }
      }
    }

    const reportedNodes = new Set();

    function getNodeKey(node) {
      if (node.loc && node.loc.start && node.loc.end) {
        return `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}`;
      }
      // Fallback for test nodes without location info
      return node;
    }

    function safeReport(node, report) {
      const nodeKey = getNodeKey(node);
      if (!reportedNodes.has(nodeKey)) {
        reportedNodes.add(nodeKey);
        context.report(report);
      }
    }

    return {
      CallExpression(node) {
        // Check Prisma operations first (most specific)
        checkPrismaOperations(node);

        // Only check ORM if not already reported
        const nodeKey = getNodeKey(node);
        if (!reportedNodes.has(nodeKey)) {
          checkORMOperations(node);
        }

        checkSQLQueries(node);
        checkMongoOperations(node);
        checkKnexOperations(node);
      }
    };
  }
};
