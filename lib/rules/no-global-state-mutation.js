/**
 * @fileoverview Rule to prevent global state mutations in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInHook } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent global state mutations that can cause test interdependencies',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-global-state-mutation.md'
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
      avoidGlobalMutation: 'Avoid mutating {{object}} in tests. Use beforeEach/afterEach for proper cleanup.',
      useLocalVariable: 'Use local variables instead of modifying global state.',
      needsCleanup: 'Global state changes need cleanup in afterEach hook.',
      avoidProcessEnv: 'Modifying process.env can affect other tests. Store original value and restore it.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowInHooks = options.allowInHooks !== false;

    function checkGlobalAssignment(node) {
      if (node.type === 'AssignmentExpression') {
        const left = node.left;
        
        // Check for global object mutations
        if (left.type === 'MemberExpression') {
          const object = left.object;
          
          // List of global objects to check
          const globalObjects = [
            'global',
            'window',
            'document',
            'process',
            'console',
            'localStorage',
            'sessionStorage',
            'navigator'
          ];
          
          if (object.type === 'Identifier' && globalObjects.includes(object.name)) {
            // Allow in setup/teardown hooks if configured
            if (allowInHooks && isInHook(node, ['beforeEach', 'afterEach', 'beforeAll', 'afterAll'])) {
              // Still warn for beforeAll without afterAll cleanup
              if (isInHook(node, ['beforeAll'])) {
                context.report({
                  node,
                  messageId: 'needsCleanup',
                  data: { object: object.name }
                });
              }
              return;
            }
            
            context.report({
              node,
              messageId: 'avoidGlobalMutation',
              data: { object: object.name }
            });
          }
          
          // Check for process.env mutations specifically
          if (object.type === 'MemberExpression' &&
              object.object.name === 'process' &&
              object.property.name === 'env') {
            
            if (!isInHook(node, ['beforeEach', 'afterEach'])) {
              context.report({
                node,
                messageId: 'avoidProcessEnv'
              });
            }
          }
        }
      }
    }

    function checkGlobalMethodCalls(node) {
      if (node.type === 'CallExpression' && 
          node.callee.type === 'MemberExpression') {
        
        const obj = node.callee.object;
        const method = node.callee.property.name;
        
        // Check for methods that modify global state
        const dangerousMethods = {
          'localStorage': ['setItem', 'removeItem', 'clear'],
          'sessionStorage': ['setItem', 'removeItem', 'clear'],
          'document': ['write', 'writeln'],
          'console': ['log', 'error', 'warn'], // These can pollute test output
          'window': ['addEventListener', 'removeEventListener']
        };
        
        if (obj.type === 'Identifier' && dangerousMethods[obj.name]) {
          if (dangerousMethods[obj.name].includes(method)) {
            // Allow console in hooks for debugging
            if (obj.name === 'console' && allowInHooks && 
                isInHook(node, ['beforeEach', 'afterEach', 'beforeAll', 'afterAll'])) {
              return;
            }
            
            if (!isInHook(node, ['beforeEach', 'afterEach'])) {
              context.report({
                node,
                messageId: 'useLocalVariable'
              });
            }
          }
        }
      }
    }

    function checkGlobalVariableDeclaration(node) {
      // Check for global variable declarations without var/let/const
      if (node.type === 'AssignmentExpression' && 
          node.left.type === 'Identifier') {
        
        const varName = node.left.name;
        
        // Check if this creates a global (no declaration)
        const scope = context.getScope();
        const variable = scope.set.get(varName);
        
        if (!variable) {
          // This creates a global variable
          context.report({
            node,
            messageId: 'useLocalVariable'
          });
        }
      }
    }

    function checkTestOnly(node) {
      // Check for test.only or it.only (covered by separate rule but impacts global state)
      if (node.type === 'CallExpression' && 
          node.callee.type === 'MemberExpression') {
        
        const obj = node.callee.object;
        const prop = node.callee.property;
        
        if ((obj.name === 'test' || obj.name === 'it' || obj.name === 'describe') &&
            prop.name === 'only') {
          // This affects global test execution state
          context.report({
            node,
            messageId: 'avoidGlobalMutation',
            data: { object: 'test execution order' }
          });
        }
      }
    }

    return {
      AssignmentExpression(node) {
        checkGlobalAssignment(node);
        checkGlobalVariableDeclaration(node);
      },
      CallExpression(node) {
        checkGlobalMethodCalls(node);
        checkTestOnly(node);
      }
    };
  }
};
