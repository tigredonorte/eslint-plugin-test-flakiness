/**
 * @fileoverview Rule to avoid non-deterministic random data in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext, isInHook } = require('../utils/helpers');

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
          allowInSetup: {
            type: 'boolean',
            default: false,
            description: 'Allow random data in setup hooks if properly seeded'
          },
          allowSeededRandom: {
            type: 'boolean',
            default: true,
            description: 'Allow random data generation when a seed is provided'
          },
          allowedMethods: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Array of method names that are allowed to use random data'
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
      avoidPerformanceNow: 'Avoid performance.now() in tests. Use fixed timing values.',
      avoidCryptoRandom: 'Avoid crypto random methods in tests. Use fixed values or seeded random.',
      avoidUUID: 'Avoid generating random UUIDs. Use fixed test IDs.',
      useSeed: 'Use a seeded random generator like {{library}}.seed() instead of unseeded {{library}}.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowSeededRandom = options.allowSeededRandom !== false;
    const allowInSetup = options.allowInSetup || false;
    const allowedMethods = options.allowedMethods || [];

    const setupHooks = ['beforeEach', 'beforeAll', 'before', 'beforeHook', 'setup'];

    function checkMathRandom(node) {
      if (node.type === 'MemberExpression' &&
          node.object.name === 'Math' &&
          node.property.name === 'random') {

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }
        
        // Check if it's being used to seed something
        if (allowSeededRandom) {
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

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }
        
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

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }

        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'avoidDateNow'
          });
        }
      }
    }

    function checkUuid(node) {
      if (node.type === 'CallExpression') {
        const callee = node.callee;

        // Check if method is in allowedMethods
        if (callee.type === 'Identifier' && allowedMethods.includes(callee.name)) {
          return;
        }
        if (callee.type === 'MemberExpression' && callee.property &&
            allowedMethods.includes(callee.property.name)) {
          return;
        }

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }
        
        // Check for crypto.randomUUID()
        if (callee.type === 'MemberExpression' &&
            callee.object.name === 'crypto' &&
            callee.property.name === 'randomUUID') {

          context.report({
            node,
            messageId: 'avoidCryptoRandom'
          });
        }

        // Check for other crypto random methods
        if (callee.type === 'MemberExpression' &&
            callee.object.name === 'crypto' &&
            ['randomBytes', 'randomInt', 'getRandomValues'].includes(callee.property.name)) {

          context.report({
            node,
            messageId: 'avoidCryptoRandom'
          });
        }
        
        // Check for uuid() calls
        if (callee.type === 'Identifier' &&
            (callee.name === 'uuid' || callee.name === 'uuidv4' ||
             callee.name === 'nanoid' || callee.name === 'shortid' ||
             callee.name === 'generateUUID')) {

          context.report({
            node,
            messageId: 'avoidUUID'
          });
        }

        // Check for uuid.v4()
        if (callee.type === 'MemberExpression' &&
            callee.object.name === 'uuid' &&
            (callee.property.name === 'v4' || callee.property.name === 'v1')) {

          context.report({
            node,
            messageId: 'avoidUUID'
          });
        }
      }
    }

    function checkPerformanceNow(node) {
      if (node.type === 'CallExpression' &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'performance' &&
          node.callee.property.name === 'now') {

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }

        context.report({
          node,
          messageId: 'avoidDateNow'
        });
      }
    }

    function checkUnseededFaker(node) {
      // Check for faker without seed
      if (node.type === 'MemberExpression' &&
          node.object.name === 'faker' &&
          !['seed', 'setSeed'].includes(node.property.name)) {

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }
        
        // Check if faker.seed() was called in the test
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();
        let hasSeeded = false;

        if (allowSeededRandom && (text.includes('faker.seed') || text.includes('faker.setSeed'))) {
          hasSeeded = true;
        }

        if (!hasSeeded) {
          context.report({
            node,
            messageId: 'useSeed',
            data: { library: 'faker' }
          });
        }
      }
    }

    function checkUnseededChance(node) {
      // Check for chance without seed
      if (node.type === 'MemberExpression' &&
          node.object.name === 'chance' &&
          !['seed'].includes(node.property.name)) {

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }

        // Check if chance.seed() was called in the test
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();
        let hasSeeded = false;

        if (allowSeededRandom && (text.includes('chance.seed') || text.includes('new Chance'))) {
          hasSeeded = true;
        }

        if (!hasSeeded) {
          context.report({
            node,
            messageId: 'useSeed',
            data: { library: 'chance' }
          });
        }
      }
    }

    function checkUnseededCasual(node) {
      // Check for casual without seed - casual properties are accessed not called
      if (node.type === 'MemberExpression' &&
          node.object.name === 'casual' &&
          !['seed', 'setSeed'].includes(node.property.name)) {

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }

        // Check if casual.seed() was called in the test
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();
        let hasSeeded = false;

        if (allowSeededRandom && (text.includes('casual.seed') || text.includes('casual.setSeed'))) {
          hasSeeded = true;
        }

        if (!hasSeeded) {
          context.report({
            node,
            messageId: 'useSeed',
            data: { library: 'casual' }
          });
        }
      }
    }

    function checkLodashRandom(node) {
      // Check for lodash random functions
      if (node.type === 'CallExpression') {
        const callee = node.callee;

        // Check if method is in allowedMethods
        if (callee.type === 'MemberExpression' && callee.property &&
            allowedMethods.includes(callee.property.name)) {
          return;
        }

        // Check if in setup hook with allowInSetup
        if (allowInSetup && isInHook(node, setupHooks)) {
          return;
        }

        // Check for _.random(), _.sample(), _.shuffle()
        if (callee.type === 'MemberExpression' &&
            callee.object.name === '_' &&
            ['random', 'sample', 'shuffle'].includes(callee.property.name)) {

          context.report({
            node,
            messageId: 'avoidRandom'
          });
        }
      }
    }

    return {
      MemberExpression(node) {
        checkMathRandom(node);
        checkUnseededFaker(node);
        checkUnseededChance(node);
        checkUnseededCasual(node);
      },
      CallExpression(node) {
        checkDateNow(node);
        checkUuid(node);
        checkPerformanceNow(node);
        checkLodashRandom(node);
      },
      NewExpression(node) {
        checkNewDate(node);
      }
    };
  }
};
