/**
 * @fileoverview Rule to avoid Promise.race in tests due to unpredictable timing
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid Promise.race in tests as it can lead to unpredictable results',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-promise-race.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowWithTimeout: {
            type: 'boolean',
            default: false
          },
          allowInHelpers: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidPromiseRace: 'Avoid Promise.race in tests. Use Promise.all or sequential awaits for predictable behavior.',
      useProperTimeout: 'Use proper timeout utilities like waitFor instead of Promise.race with timeout patterns.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    // Get configuration options
    const options = context.options[0] || {};
    const allowWithTimeout = options.allowWithTimeout || false;
    const allowInHelpers = options.allowInHelpers !== false; // default true

    function isInHelperFunction(node) {
      if (!allowInHelpers) return false;

      // Check if we're inside a function that looks like a helper
      let parent = node.parent;
      while (parent) {
        // Check if we're inside a function declaration or expression
        if (parent.type === 'FunctionDeclaration' ||
            parent.type === 'FunctionExpression' ||
            parent.type === 'ArrowFunctionExpression') {

          // Check if the function looks like a helper (not a test)
          const funcParent = parent.parent;

          // If it's a function declaration, check the name
          if (parent.type === 'FunctionDeclaration' && parent.id) {
            const name = parent.id.name.toLowerCase();
            // Exclude common test function names
            if (name === 'test' || name === 'it' || name === 'describe') {
              return false;
            }
            // Common helper function patterns
            if (name.includes('helper') || name.includes('util') ||
                name.includes('create') || name.includes('setup') ||
                name.includes('factory') || name.includes('mock')) {
              return true;
            }
          }

          // If it's assigned to a variable, check the variable name
          if (funcParent && funcParent.type === 'VariableDeclarator' && funcParent.id) {
            const name = funcParent.id.name.toLowerCase();
            if (name.includes('helper') || name.includes('util') ||
                name.includes('create') || name.includes('setup') ||
                name.includes('factory') || name.includes('mock')) {
              return true;
            }
          }

          // If it's not inside a test block (it/test/describe), consider it a helper
          if (!isInsideTestBlock(parent)) {
            return true;
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    function isInsideTestBlock(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression' && parent.callee.type === 'Identifier') {
          const name = parent.callee.name;
          if (name === 'it' || name === 'test' || name === 'describe' ||
              name === 'beforeEach' || name === 'afterEach' ||
              name === 'beforeAll' || name === 'afterAll') {
            return true;
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    function checkPromiseRace(node) {
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Promise' &&
          node.callee.property.name === 'race') {

        // Check if it's in a helper function and that's allowed
        if (allowInHelpers && isInHelperFunction(node)) {
          return;
        }

        // Check if it's a specific timeout pattern
        const arg = node.arguments[0];
        if (arg && arg.type === 'ArrayExpression') {
          const sourceCode = context.getSourceCode();
          // Define timeout-related patterns as separate regexes for clarity
          const timeoutPatterns = [
            // Matches: new Promise(...) with setTimeout and reject
            /new Promise\([^)]*setTimeout.*reject/i,
            // Matches: rejectAfter(123)
            /rejectAfter\(\d+\)/i,
            // Matches: setTimeout(..., ...) with reject
            /setTimeout.*reject/i,
            // Matches: timeoutPromise
            /timeoutPromise/i,
            // Matches: timeout(...)
            /timeout\(/i
          ];
          const hasTimeout = arg.elements.some(el => {
            if (!el) return false;
            const text = sourceCode.getText(el);
            // Check if any timeout pattern matches
            return timeoutPatterns.some(pattern => pattern.test(text));
          });

          if (hasTimeout) {
            // If timeout patterns are allowed, skip reporting
            if (allowWithTimeout) {
              return;
            }

            context.report({
              node,
              messageId: 'useProperTimeout'
            });
            return;
          }
        }

        // Default to general avoidPromiseRace message
        context.report({
          node,
          messageId: 'avoidPromiseRace'
        });
      }
    }

    return {
      CallExpression(node) {
        checkPromiseRace(node);
      }
    };
  }
};
