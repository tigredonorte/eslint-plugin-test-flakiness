/**
 * @fileoverview Rule to prevent focused or skipped tests that can cause incomplete test runs
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, getFilename } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent focused or skipped tests that can cause incomplete test runs',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-test-focus.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowSkip: {
            type: 'boolean',
            default: false,
            description: 'Allow skip methods (test.skip, describe.skip, etc.)'
          },
          allowOnly: {
            type: 'boolean',
            default: false,
            description: 'Allow only/focus methods (test.only, describe.only, etc.)'
          },
          customFocusPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Additional patterns to detect as focused tests'
          },
          customSkipPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Additional patterns to detect as skipped tests'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noTestOnly: 'Unexpected {{method}}.only - this will cause other tests to be skipped',
      noTestSkip: 'Unexpected {{method}}.skip - this test will not run',
      noFocusedTest: 'Unexpected focused test ({{method}}) - this will cause other tests to be skipped',
      noSkippedTest: 'Unexpected skipped test ({{method}}) - this test will not run'
    }
  },

  create(context) {
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
      return {};
    }

    const options = context.options ? (context.options[0] || {}) : {};
    const allowSkip = options.allowSkip || false;
    const allowOnly = options.allowOnly || false;
    const customFocusPatterns = options.customFocusPatterns || [];
    const customSkipPatterns = options.customSkipPatterns || [];

    // Helper function to match wildcard patterns
    function matchPattern(str, pattern) {
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        .replace(/\*/g, '.*'); // Replace * with .*
      const regex = new RegExp('^' + regexPattern + '$');
      return regex.test(str);
    }

    function checkMemberExpression(node) {
      if (node.object && node.property) {
        const objectName = node.object.name || (node.object.property && node.object.property.name);

        // Handle both dot notation and bracket notation
        let propertyName;
        if (node.computed) {
          // Handle bracket notation like test['only'] or test[`only`]
          if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
            propertyName = node.property.value;
          } else if (node.property.type === 'TemplateLiteral' &&
                     node.property.quasis.length === 1 &&
                     node.property.expressions.length === 0) {
            // Handle simple template literals without expressions
            propertyName = node.property.quasis[0].value.raw;
          }
        } else {
          // Standard dot notation
          propertyName = node.property.name;
        }

        // Standard test runners
        const testMethods = ['test', 'it', 'describe', 'suite', 'context'];

        // Check for .only or ['only']
        if (!allowOnly && propertyName === 'only' && testMethods.includes(objectName)) {
          context.report({
            node,
            messageId: 'noTestOnly',
            data: { method: objectName },
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              if (node.computed) {
                // For bracket notation, replace entire member expression with just the object
                return fixer.replaceText(node, objectName);
              } else {
                // For dot notation, remove .only
                const dotToken = sourceCode.getTokenBefore(node.property);
                return fixer.removeRange([dotToken.range[0], node.property.range[1]]);
              }
            }
          });
        }

        // Check for .skip or ['skip']
        if (!allowSkip && propertyName === 'skip' && testMethods.includes(objectName)) {
          context.report({
            node,
            messageId: 'noTestSkip',
            data: { method: objectName },
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              if (node.computed) {
                // For bracket notation, replace entire member expression with just the object
                return fixer.replaceText(node, objectName);
              } else {
                // For dot notation, remove .skip
                const dotToken = sourceCode.getTokenBefore(node.property);
                return fixer.removeRange([dotToken.range[0], node.property.range[1]]);
              }
            }
          });
        }

        // Check for .todo or ['todo']
        if (!allowSkip && propertyName === 'todo' && testMethods.includes(objectName)) {
          context.report({
            node,
            messageId: 'noTestSkip',
            data: { method: objectName },
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              if (node.computed) {
                // For bracket notation, replace entire member expression with just the object
                return fixer.replaceText(node, objectName);
              } else {
                // For dot notation, remove .todo
                const dotToken = sourceCode.getTokenBefore(node.property);
                return fixer.removeRange([dotToken.range[0], node.property.range[1]]);
              }
            }
          });
        }
      }
    }

    function checkCallExpression(node) {
      if (!node.callee) return;

      const calleeName = node.callee.name;

      // Check for focused test methods (fdescribe, fit, ftest)
      if (!allowOnly && calleeName) {
        const focusedMethods = ['fdescribe', 'fit', 'ftest', 'fcontext', 'fsuite'];
        if (focusedMethods.includes(calleeName)) {
          // Check if this looks like a test function call (has arguments)
          // and is not a local variable/function definition
          if (node.arguments && node.arguments.length > 0) {
            // Check first argument is a string (test description)
            const firstArg = node.arguments[0];
            if (firstArg && (firstArg.type === 'Literal' || firstArg.type === 'TemplateLiteral')) {
              context.report({
                node,
                messageId: 'noFocusedTest',
                data: { method: calleeName },
                fix(fixer) {
                  // Remove 'f' prefix
                  return fixer.replaceText(node.callee, calleeName.substring(1));
                }
              });
            }
          }
        }

        // Check custom focus patterns
        for (const pattern of customFocusPatterns) {
          if (calleeName === pattern || (pattern.includes('*') && matchPattern(calleeName, pattern))) {
            context.report({
              node,
              messageId: 'noFocusedTest',
              data: { method: calleeName },
              fix(fixer) {
                // Try to provide auto-fix for custom patterns
                // If pattern starts with 'f', try removing it
                if (calleeName.startsWith('f') && calleeName.length > 1) {
                  const unfocused = calleeName.substring(1);
                  // Check if unfocused version is a known test method
                  const testMethods = ['describe', 'it', 'test', 'context', 'suite'];
                  if (testMethods.includes(unfocused)) {
                    return fixer.replaceText(node.callee, unfocused);
                  }
                }
                // If pattern ends with 'Only', try removing it
                if (calleeName.endsWith('Only') && calleeName.length > 4) {
                  const unfocused = calleeName.slice(0, -4);
                  return fixer.replaceText(node.callee, unfocused);
                }
                // If pattern contains '.only', try removing it
                if (calleeName.includes('.only')) {
                  const unfocused = calleeName.replace('.only', '');
                  return fixer.replaceText(node.callee, unfocused);
                }
                // No auto-fix available for this pattern
                return null;
              }
            });
            break;
          }
        }
      }

      // Check for skipped test methods (xdescribe, xit, xtest)
      if (!allowSkip && calleeName) {
        const skippedMethods = ['xdescribe', 'xit', 'xtest', 'xcontext', 'xsuite'];
        if (skippedMethods.includes(calleeName)) {
          // Check if this looks like a test function call (has arguments)
          // and is not a local variable/function definition
          if (node.arguments && node.arguments.length > 0) {
            // Check first argument is a string (test description)
            const firstArg = node.arguments[0];
            if (firstArg && (firstArg.type === 'Literal' || firstArg.type === 'TemplateLiteral')) {
              context.report({
                node,
                messageId: 'noSkippedTest',
                data: { method: calleeName },
                fix(fixer) {
                  // Remove 'x' prefix
                  return fixer.replaceText(node.callee, calleeName.substring(1));
                }
              });
            }
          }
        }

        // Check custom skip patterns
        for (const pattern of customSkipPatterns) {
          if (calleeName === pattern || (pattern.includes('*') && matchPattern(calleeName, pattern))) {
            context.report({
              node,
              messageId: 'noSkippedTest',
              data: { method: calleeName },
              fix(fixer) {
                // Try to provide auto-fix for custom patterns
                // If pattern starts with 'x', try removing it
                if (calleeName.startsWith('x') && calleeName.length > 1) {
                  const unskipped = calleeName.substring(1);
                  // Check if unskipped version is a known test method
                  const testMethods = ['describe', 'it', 'test', 'context', 'suite'];
                  if (testMethods.includes(unskipped)) {
                    return fixer.replaceText(node.callee, unskipped);
                  }
                }
                // If pattern ends with 'Skip', try removing it
                if (calleeName.endsWith('Skip') && calleeName.length > 4) {
                  const unskipped = calleeName.slice(0, -4);
                  return fixer.replaceText(node.callee, unskipped);
                }
                // If pattern contains '.skip', try removing it
                if (calleeName.includes('.skip')) {
                  const unskipped = calleeName.replace('.skip', '');
                  return fixer.replaceText(node.callee, unskipped);
                }
                // No auto-fix available for this pattern
                return null;
              }
            });
            break;
          }
        }
      }

      // Check for member expressions like test.only, describe.skip, test['only'], test[`skip`]
      if (node.callee.type === 'MemberExpression') {
        checkMemberExpression(node.callee);
      }
    }

    return {
      CallExpression: checkCallExpression,
      TaggedTemplateExpression: function(node) {
        // Handle template literal test calls like fit`test` or test.only`test`
        const tag = node.tag;

        if (tag.type === 'Identifier') {
          // Handle fit`test`, xdescribe`test`
          const tagName = tag.name;
          if (!allowOnly) {
            const focusedMethods = ['fdescribe', 'fit', 'ftest', 'fcontext', 'fsuite'];
            if (focusedMethods.includes(tagName)) {
              context.report({
                node,
                messageId: 'noFocusedTest',
                data: { method: tagName },
                fix(fixer) {
                  // Remove 'f' prefix
                  return fixer.replaceText(tag, tagName.substring(1));
                }
              });
            }
          }
          if (!allowSkip) {
            const skippedMethods = ['xdescribe', 'xit', 'xtest', 'xcontext', 'xsuite'];
            if (skippedMethods.includes(tagName)) {
              context.report({
                node,
                messageId: 'noSkippedTest',
                data: { method: tagName },
                fix(fixer) {
                  // Remove 'x' prefix
                  return fixer.replaceText(tag, tagName.substring(1));
                }
              });
            }
          }
        } else if (tag.type === 'MemberExpression') {
          // Handle test.only`test`, describe.skip`test`
          checkMemberExpression(tag);
        }
      }
    };
  }
};