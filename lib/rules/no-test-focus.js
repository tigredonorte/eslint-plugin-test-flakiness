/**
 * @fileoverview Rule to prevent focused or skipped tests that can cause incomplete test runs
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, getFilename } = require('../utils/helpers');

// Standard test method names (including suite which was previously only in specific checks)
const TEST_METHODS = ['test', 'it', 'describe', 'suite', 'context'];
const FOCUSED_METHODS = ['fdescribe', 'fit', 'ftest', 'fcontext', 'fsuite'];
const SKIPPED_METHODS = ['xdescribe', 'xit', 'xtest', 'xcontext', 'xsuite'];

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

    // Helper to robustly extract object name from MemberExpression
    function getObjectName(node) {
      if (!node) return undefined;
      if (node.type === 'Identifier') {
        return node.name;
      }
      if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
      }
      if (node.type === 'TemplateLiteral' &&
          node.quasis.length === 1 &&
          node.expressions.length === 0) {
        return node.quasis[0].value.raw;
      }
      if (node.type === 'MemberExpression') {
        // Recursively build the object name
        const object = getObjectName(node.object);
        let property;
        if (node.computed) {
          // For computed properties, get the value if it's a literal
          if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
            property = node.property.value;
          } else {
            property = getObjectName(node.property);
          }
        } else {
          property = node.property && node.property.name;
        }
        if (object && property) {
          // For computed properties, add brackets to maintain the syntax
          if (node.computed) {
            return object + '[' + property + ']';
          }
          return object + '.' + property;
        }
        return object || property;
      }
      return undefined;
    }

    // Helper to check if node looks like a test function call
    function isTestFunctionCall(node) {
      if (!node.arguments || node.arguments.length === 0) {
        return false;
      }
      const firstArg = node.arguments[0];
      return firstArg && (firstArg.type === 'Literal' || firstArg.type === 'TemplateLiteral');
    }

    // Helper to generate auto-fix for custom patterns
    function getCustomPatternFix(calleeName, type, fixer, node) {
      const prefixToRemove = type === 'focus' ? 'f' : 'x';
      const suffixToRemove = type === 'focus' ? 'Only' : 'Skip';
      const modifierToRemove = type === 'focus' ? '.only' : '.skip';

      // If pattern starts with prefix (f/x), try removing it
      if (calleeName.startsWith(prefixToRemove) && calleeName.length > 1) {
        const modified = calleeName.substring(1);
        // Check if modified version is a known test method
        if (TEST_METHODS.includes(modified)) {
          return fixer.replaceText(node.callee, modified);
        }
      }

      // If pattern ends with suffix (Only/Skip), try removing it
      if (calleeName.endsWith(suffixToRemove) && calleeName.length > suffixToRemove.length) {
        const modified = calleeName.slice(0, -suffixToRemove.length);
        return fixer.replaceText(node.callee, modified);
      }

      // If pattern contains modifier (.only/.skip), try removing it
      if (calleeName.includes(modifierToRemove)) {
        const modified = calleeName.replace(modifierToRemove, '');
        return fixer.replaceText(node.callee, modified);
      }

      // No auto-fix available for this pattern
      return null;
    }

    function checkMemberExpression(node) {
      if (node.object && node.property) {
        const objectName = getObjectName(node.object);

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

        // Check if objectName is a test method or ends with a test method
        // This handles cases like window.global['test'].only
        const isTestMethod = (name) => {
          if (!name) return false;
          if (TEST_METHODS.includes(name)) return true;
          // Also check 'suite' and 'context' which are test methods
          if (name === 'suite' || name === 'context') return true;

          // Check if it ends with a test method (for nested expressions)
          // Extract the last part after . or ]
          const lastPart = name.split(/[.[\]]/).filter(Boolean).pop();
          return TEST_METHODS.includes(lastPart);
        };

        // Extract the base test method name (e.g., 'test' from 'window.global[test]')
        const getTestMethodName = (name) => {
          if (!name) return name;
          // Direct match
          if (TEST_METHODS.includes(name) || name === 'suite' || name === 'context') {
            return name;
          }
          // Extract the last part that matches a test method
          const parts = name.split(/[.[\]]/).filter(Boolean);
          for (let i = parts.length - 1; i >= 0; i--) {
            if (TEST_METHODS.includes(parts[i]) || parts[i] === 'suite' || parts[i] === 'context') {
              return parts[i];
            }
          }
          return name;
        };

        // For custom patterns, check if objectName matches
        const matchesCustomPattern = (name, modifier) => {
          if (!name) return false;

          // Check custom patterns
          const patterns = modifier === 'skip' ? customSkipPatterns :
                           modifier === 'only' ? customFocusPatterns : [];

          for (const pattern of patterns) {
            const fullPattern = name + '.' + modifier;
            if (fullPattern === pattern || (pattern.includes('*') && matchPattern(fullPattern, pattern))) {
              return { matched: true, pattern: fullPattern };
            }
          }

          return { matched: false };
        };

        // Check for .only or ['only']
        if (!allowOnly && propertyName === 'only') {
          const customMatch = matchesCustomPattern(objectName, 'only');
          if (isTestMethod(objectName)) {
            const methodName = getTestMethodName(objectName);
            context.report({
              node,
              messageId: 'noTestOnly',
              data: { method: methodName },
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
          } else if (customMatch.matched) {
            context.report({
              node,
              messageId: 'noFocusedTest',
              data: { method: customMatch.pattern },
              fix(fixer) {
                // For member expressions with custom patterns, remove the modifier
                const sourceCode = context.getSourceCode();
                if (node.computed) {
                  return fixer.replaceText(node, objectName);
                } else {
                  const dotToken = sourceCode.getTokenBefore(node.property);
                  return fixer.removeRange([dotToken.range[0], node.property.range[1]]);
                }
              }
            });
          }
        }

        // Check for .skip or ['skip']
        if (!allowSkip && propertyName === 'skip') {
          const customMatch = matchesCustomPattern(objectName, 'skip');
          if (isTestMethod(objectName)) {
            const methodName = getTestMethodName(objectName);
            context.report({
              node,
              messageId: 'noTestSkip',
              data: { method: methodName },
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
          } else if (customMatch.matched) {
            context.report({
              node,
              messageId: 'noSkippedTest',
              data: { method: customMatch.pattern },
              fix(fixer) {
                // For custom patterns like myTest.skip, remove .skip
                const sourceCode = context.getSourceCode();
                if (node.computed) {
                  return fixer.replaceText(node, objectName);
                } else {
                  const dotToken = sourceCode.getTokenBefore(node.property);
                  return fixer.removeRange([dotToken.range[0], node.property.range[1]]);
                }
              }
            });
          }
        }

        // Check for .todo or ['todo']
        if (!allowSkip && propertyName === 'todo' && isTestMethod(objectName)) {
          const methodName = getTestMethodName(objectName);
          context.report({
            node,
            messageId: 'noTestSkip',
            data: { method: methodName },
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
        if (FOCUSED_METHODS.includes(calleeName)) {
          // Check if this looks like a test function call (has arguments)
          // and is not a local variable/function definition
          if (isTestFunctionCall(node)) {
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

        // Check custom focus patterns
        for (const pattern of customFocusPatterns) {
          if (calleeName === pattern || (pattern.includes('*') && matchPattern(calleeName, pattern))) {
            context.report({
              node,
              messageId: 'noFocusedTest',
              data: { method: calleeName },
              fix(fixer) {
                return getCustomPatternFix(calleeName, 'focus', fixer, node);
              }
            });
            break;
          }
        }
      }

      // Check for skipped test methods (xdescribe, xit, xtest)
      if (!allowSkip && calleeName) {
        if (SKIPPED_METHODS.includes(calleeName)) {
          // Check if this looks like a test function call (has arguments)
          // and is not a local variable/function definition
          if (isTestFunctionCall(node)) {
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

        // Check custom skip patterns
        for (const pattern of customSkipPatterns) {
          if (calleeName === pattern || (pattern.includes('*') && matchPattern(calleeName, pattern))) {
            context.report({
              node,
              messageId: 'noSkippedTest',
              data: { method: calleeName },
              fix(fixer) {
                return getCustomPatternFix(calleeName, 'skip', fixer, node);
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
            if (FOCUSED_METHODS.includes(tagName)) {
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
            if (SKIPPED_METHODS.includes(tagName)) {
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