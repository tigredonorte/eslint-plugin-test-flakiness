/**
 * @fileoverview Rule to avoid non-deterministic random data in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid non-deterministic random data generation in tests',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-random-data.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowSeeded: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidRandom: 'Avoid Math.random() in tests. Use fixed values or seeded random.',
      avoidDateNow: 'Avoid Date.now() in tests. Use fixed timestamps.',
      avoidNewDate: 'Avoid new Date() without arguments. Use fixed dates.',
      useSeeded: 'Use a seeded random generator like faker.seed() or chance.seed().',
      avoidUuid: 'Avoid generating random UUIDs. Use fixed test IDs.',
      avoidPerformanceNow: 'Avoid performance.now() in tests. Use fixed timing values.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowSeeded = options.allowSeeded !== false;

    function checkMathRandom(node) {
      if (node.type === 'MemberExpression' &&
          node.object.name === 'Math' &&
          node.property.name === 'random') {
        
        // Check if it's being used to seed something
        if (allowSeeded) {
          const parent = node.parent;
          if (parent && parent.type === 'CallExpression') {
            const grandParent = parent.parent;
            if (grandParent && grandParent.type === 'CallExpression') {
              const callee = grandParent.callee;
              if (callee.type === 'MemberExpression' &&
                  callee.property.name === 'seed') {
                return; // Allow Math.random() when used for seeding
              }
            }
          }
        }
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'avoidRandom'
          });
        }
      }
    }

    function checkDateNow(node) {
      if (node.type === 'CallExpression' &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Date' &&
          node.callee.property.name === 'now') {
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'avoidDateNow'
          });
        }
      }
    }

    function checkNewDate(node) {
      if (node.type === 'NewExpression' &&
          node.callee.name === 'Date' &&
          node.arguments.length === 0) {
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'avoidNewDate'
          });
        }
      }
    }

    function checkUuid(node) {
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        
        // Check for crypto.randomUUID()
        if (callee.type === 'MemberExpression' &&
            callee.object.name === 'crypto' &&
            callee.property.name === 'randomUUID') {
          
          context.report({
            node,
            messageId: 'avoidUuid'
          });
        }
        
        // Check for uuid() calls
        if (callee.type === 'Identifier' &&
            (callee.name === 'uuid' || callee.name === 'uuidv4' || 
             callee.name === 'nanoid' || callee.name === 'shortid')) {
          
          context.report({
            node,
            messageId: 'avoidUuid'
          });
        }
        
        // Check for uuid.v4()
        if (callee.type === 'MemberExpression' &&
            callee.object.name === 'uuid' &&
            (callee.property.name === 'v4' || callee.property.name === 'v1')) {
          
          context.report({
            node,
            messageId: 'avoidUuid'
          });
        }
      }
    }

    function checkPerformanceNow(node) {
      if (node.type === 'CallExpression' &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'performance' &&
          node.callee.property.name === 'now') {
        
        context.report({
          node,
          messageId: 'avoidPerformanceNow'
        });
      }
    }

    function checkUnseededFaker(node) {
      // Check for faker without seed
      if (node.type === 'MemberExpression' &&
          node.object.name === 'faker' &&
          !['seed', 'setSeed'].includes(node.property.name)) {
        
        // Check if faker.seed() was called in the test
        const scope = context.getScope();
        let hasSeeded = false;
        
        // Simple check - could be improved with proper scope analysis
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();
        if (text.includes('faker.seed') || text.includes('faker.setSeed')) {
          hasSeeded = true;
        }
        
        if (!hasSeeded && !allowSeeded) {
          context.report({
            node,
            messageId: 'useSeeded'
          });
        }
      }
    }

    return {
      MemberExpression(node) {
        checkMathRandom(node);
        checkUnseededFaker(node);
      },
      CallExpression(node) {
        checkDateNow(node);
        checkUuid(node);
        checkPerformanceNow(node);
      },
      NewExpression(node) {
        checkNewDate(node);
      }
    };
  }
};
