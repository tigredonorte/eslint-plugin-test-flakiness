/**
 * @fileoverview Rule to prevent unconditional waits in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unconditional waits that don\'t wait for specific conditions',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-unconditional-wait.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          maxTimeout: {
            type: 'number',
            default: 1000,
            description: 'Maximum allowed timeout duration in milliseconds'
          },
          allowInSetup: {
            type: 'boolean',
            default: true,
            description: 'Allow unconditional waits in setup/teardown hooks'
          },
          allowedMethods: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Array of method names that are allowed to use unconditional waits'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidUnconditionalWait: 'Avoid unconditional wait. Wait for specific conditions instead.',
      useWaitFor: 'Use waitFor() with an assertion instead of fixed delay.',
      useDataTestId: 'Wait for specific elements or conditions instead of arbitrary delays.',
      exceedsMaxTimeout: 'Timeout of {{timeout}}ms exceeds maximum allowed timeout of {{maxTimeout}}ms.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    // Get configuration options - only apply maxTimeout if explicitly configured
    const options = context.options ? (context.options[0] || {}) : {};
    const maxTimeout = options.maxTimeout;  // undefined means no limit
    const allowInSetup = options.allowInSetup !== undefined ? options.allowInSetup : true;
    const allowedMethods = options.allowedMethods || [];

    // Helper function to check if we're in a setup/teardown hook
    function isInSetupHook(node) {
      if (!allowInSetup) return false;

      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression' && parent.callee) {
          const calleeName = parent.callee.type === 'Identifier'
            ? parent.callee.name
            : parent.callee.type === 'MemberExpression' && parent.callee.property
              ? parent.callee.property.name
              : null;

          if (calleeName) {
            const setupHooks = [
              'beforeAll', 'beforeEach', 'afterAll', 'afterEach',
              'before', 'beforeEach', 'after', 'afterEach',
              'setup', 'teardown', 'setupTest', 'teardownTest',
              'beforeHook', 'afterHook'
            ];
            if (setupHooks.includes(calleeName)) {
              return true;
            }
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    // Helper function to check if a method is in the allowed list
    function isAllowedMethod(node) {
      if (allowedMethods.length === 0) return false;

      let methodName = null;
      if (node.callee.type === 'Identifier') {
        methodName = node.callee.name;
      } else if (node.callee.type === 'MemberExpression' && node.callee.property) {
        methodName = node.callee.property.name;
      }

      return methodName && allowedMethods.includes(methodName);
    }

    // Helper function to check if timeout exceeds max
    function checkTimeoutValue(node, timeout) {
      if (maxTimeout && timeout > maxTimeout) {
        context.report({
          node,
          messageId: 'exceedsMaxTimeout',
          data: {
            timeout,
            maxTimeout
          }
        });
        return true;
      }
      return false;
    }

    function checkWaitWithoutCondition(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for cy.wait(number) without alias
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'cy' &&
          node.callee.property.name === 'wait') {

        const arg = node.arguments[0];
        if (arg && arg.type === 'Literal' && typeof arg.value === 'number') {
          // Check if timeout exceeds max
          if (checkTimeoutValue(node, arg.value)) return;

          // Skip the regular error if in setup hook and allowed
          if (isInSetupHook(node)) return;

          context.report({
            node,
            messageId: 'avoidUnconditionalWait',
            fix(fixer) {
              // Check if there's already a semicolon after the node
              const sourceCode = context.getSourceCode();
              const hasSemicolon = sourceCode.text[node.range[1]] === ';';
              const replacement = hasSemicolon
                ? 'cy.wait(\'@apiCall\') // TODO: Replace with actual alias or remove wait'
                : 'cy.wait(\'@apiCall\') // TODO: Replace with actual alias or remove wait;';

              return fixer.replaceText(node, replacement);
            }
          });
        }
      }
    }

    function checkSetTimeout(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for setTimeout with fixed delays
      if (node.callee.name === 'setTimeout' ||
          (node.callee.type === 'MemberExpression' &&
           node.callee.property.name === 'setTimeout')) {

        if (!isInMockContext(node, context)) {
          // Check timeout value if it's a literal
          const timeoutArg = node.arguments[1];
          if (timeoutArg && timeoutArg.type === 'Literal' && typeof timeoutArg.value === 'number') {
            if (checkTimeoutValue(node, timeoutArg.value)) return;
          }

          // Skip the regular error if in setup hook and allowed
          if (isInSetupHook(node)) return;
          // Check if it's part of a polling pattern or Promise constructor
          let parent = node.parent;
          while (parent) {
            const sourceCode = context.getSourceCode();
            const parentText = sourceCode.getText(parent);
            // If it's part of a conditional check or polling, it's valid
            if (/if\s*\(.*\)|check|poll|retry|clearInterval/.test(parentText)) {
              return;
            }
            // Check if it's within a Promise constructor - let Promise checker handle it
            if (parent.type === 'NewExpression' && parent.callee && parent.callee.name === 'Promise') {
              return;
            }
            // Don't traverse too far up, but continue past ArrowFunctionExpression
            // in case it's a Promise constructor callback
            if (parent.type === 'FunctionDeclaration' ||
                parent.type === 'FunctionExpression') {
              break;
            }
            // Only break on ArrowFunctionExpression if we've already checked a few parents
            if (parent.type === 'ArrowFunctionExpression' && parent.parent) {
              // Check if the parent of ArrowFunction is Promise constructor
              const grandParent = parent.parent;
              if (grandParent.type === 'NewExpression' && grandParent.callee && grandParent.callee.name === 'Promise') {
                return;
              }
              // Otherwise break here
              break;
            }
            parent = parent.parent;
          }

          context.report({
            node,
            messageId: 'useWaitFor'
          });
        }
      }
    }

    function checkSetInterval(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for setInterval without clear condition
      if (node.callee.name === 'setInterval') {
        if (!isInMockContext(node, context)) {
          // Check interval value if it's a literal
          const intervalArg = node.arguments[1];
          if (intervalArg && intervalArg.type === 'Literal' && typeof intervalArg.value === 'number') {
            if (checkTimeoutValue(node, intervalArg.value)) return;
          }

          // Skip the regular error if in setup hook and allowed
          if (isInSetupHook(node)) return;
          // Check if the callback has a condition to clear the interval
          const callback = node.arguments[0];
          if (callback) {
            const sourceCode = context.getSourceCode();
            const callbackText = sourceCode.getText(callback);
            // If it contains clearInterval or a condition, it's likely valid
            if (/clearInterval|if\s*\(/.test(callbackText)) {
              return;
            }
          }
          context.report({
            node,
            messageId: 'useDataTestId'
          });
        }
      }
    }

    function checkPromiseWithTimeout(node, awaitNode) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for new Promise with only setTimeout
      if (node.type === 'NewExpression' && node.callee.name === 'Promise') {
        const arg = node.arguments[0];
        if (arg && arg.type === 'ArrowFunctionExpression') {
          const body = arg.body;

          // Check if body is just setTimeout
          if (body.type === 'CallExpression' &&
              body.callee.name === 'setTimeout') {

            // Check if it's a simple timeout (resolve => setTimeout(resolve, n))
            const setTimeoutFirstArg = body.arguments[0];
            const timeoutValue = body.arguments[1];

            // Check timeout value if it's a literal
            if (timeoutValue && timeoutValue.type === 'Literal' && typeof timeoutValue.value === 'number') {
              if (checkTimeoutValue(node, timeoutValue.value)) return;
            }

            if (setTimeoutFirstArg &&
                setTimeoutFirstArg.type === 'Identifier' &&
                arg.params[0] &&
                arg.params[0].type === 'Identifier' &&
                setTimeoutFirstArg.name === arg.params[0].name) {

              // Skip the regular error if in setup hook and allowed
              if (isInSetupHook(node)) return;

              context.report({
                node,
                messageId: 'useWaitFor',
                fix(fixer) {
                  const targetNode = awaitNode || node;
                  const sourceCode = context.getSourceCode();
                  const hasSemicolon = sourceCode.text[targetNode.range[1]] === ';';
                  const replacement = hasSemicolon
                    ? 'await waitFor(() => {\n  // TODO: Add assertion or condition\n  expect(true).toBe(true);\n})'
                    : 'await waitFor(() => {\n  // TODO: Add assertion or condition\n  expect(true).toBe(true);\n});';

                  return fixer.replaceText(targetNode, replacement);
                }
              });
            }
          } else if (body.type === 'BlockStatement') {
            // Check for polling patterns - if it has a check function, it's valid
            const sourceCode = context.getSourceCode();
            const bodyText = sourceCode.getText(body);
            if (!/if\s*\(|check|poll|retry/.test(bodyText)) {
              // Check if the body only contains setTimeout
              const hasOnlySetTimeout = body.body.length === 1 &&
                body.body[0].type === 'ExpressionStatement' &&
                body.body[0].expression.type === 'CallExpression' &&
                body.body[0].expression.callee.name === 'setTimeout';

              if (hasOnlySetTimeout) {
                // Skip the regular error if in setup hook and allowed
                if (isInSetupHook(node)) return;

                context.report({
                  node,
                  messageId: 'useWaitFor'
                });
              }
            }
          }
        }
      }
    }

    function checkWaitForWithoutAssertion(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for waitFor with empty or no-op callback
      if (node.callee.name === 'waitFor' ||
          (node.callee.type === 'MemberExpression' &&
           node.callee.property.name === 'waitFor')) {

        const callback = node.arguments[0];
        if (callback && callback.type === 'ArrowFunctionExpression') {
          const body = callback.body;

          // Check for empty body
          if (body.type === 'BlockStatement') {
            if (body.body.length === 0) {
              // Skip the regular error if in setup hook and allowed
              if (isInSetupHook(node)) return;

              context.report({
                node,
                messageId: 'useWaitFor'
              });
            } else {
              // Check if body only contains console.log or similar non-assertions
              const hasAssertion = body.body.some(stmt => {
                // Allow return statements (they return elements to wait for)
                if (stmt.type === 'ReturnStatement') {
                  return true;
                }
                const stmtText = context.getSourceCode().getText(stmt);
                return /expect|assert|should|getBy|findBy|queryBy/.test(stmtText);
              });

              if (!hasAssertion) {
                // Skip the regular error if in setup hook and allowed
                if (isInSetupHook(node)) return;

                context.report({
                  node,
                  messageId: 'useWaitFor'
                });
              }
            }
          }
        }
      }
    }

    function checkPlaywrightWaitForTimeout(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for page.waitForTimeout() in Playwright
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        const obj = context.getSourceCode().getText(node.callee.object);

        if (method === 'waitForTimeout' && /page|frame|context/.test(obj)) {
          // Check timeout value if it's a literal
          const timeoutArg = node.arguments[0];
          if (timeoutArg && timeoutArg.type === 'Literal' && typeof timeoutArg.value === 'number') {
            if (checkTimeoutValue(node, timeoutArg.value)) return;
          }

          // Skip the regular error if in setup hook and allowed
          if (isInSetupHook(node)) return;

          context.report({
            node,
            messageId: 'avoidUnconditionalWait',
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              const hasSemicolon = sourceCode.text[node.range[1]] === ';';

              if (hasSemicolon) {
                // Replace both the node and the semicolon
                return fixer.replaceTextRange(
                  [node.range[0], node.range[1] + 1],
                  `${obj}.waitForSelector('[data-testid="element"]'); // TODO: Replace with actual selector`
                );
              } else {
                // Just replace the node
                return fixer.replaceText(
                  node,
                  `${obj}.waitForSelector('[data-testid="element"]'); // TODO: Replace with actual selector`
                );
              }
            }
          });
        }
      }
    }

    function checkBrowserPause(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for browser.pause() in WebdriverIO
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'browser' &&
          node.callee.property.name === 'pause') {

        // Check timeout value if it's a literal
        const timeoutArg = node.arguments[0];
        if (timeoutArg && timeoutArg.type === 'Literal' && typeof timeoutArg.value === 'number') {
          if (checkTimeoutValue(node, timeoutArg.value)) return;
        }

        // Skip the regular error if in setup hook and allowed
        if (isInSetupHook(node)) return;

        context.report({
          node,
          messageId: 'avoidUnconditionalWait',
          fix(fixer) {
            const sourceCode = context.getSourceCode();
            const hasSemicolon = sourceCode.text[node.range[1]] === ';';

            if (hasSemicolon) {
              return fixer.replaceTextRange(
                [node.range[0], node.range[1] + 1],
                'browser.waitUntil(() => element.isDisplayed()); // TODO: Add condition'
              );
            } else {
              return fixer.replaceText(
                node,
                'browser.waitUntil(() => element.isDisplayed()); // TODO: Add condition'
              );
            }
          }
        });
      }
    }

    function checkDriverSleep(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for driver.sleep() in Selenium
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'driver' &&
          node.callee.property.name === 'sleep') {

        // Check timeout value if it's a literal
        const timeoutArg = node.arguments[0];
        if (timeoutArg && timeoutArg.type === 'Literal' && typeof timeoutArg.value === 'number') {
          if (checkTimeoutValue(node, timeoutArg.value)) return;
        }

        // Skip the regular error if in setup hook and allowed
        if (isInSetupHook(node)) return;

        context.report({
          node,
          messageId: 'avoidUnconditionalWait',
          fix(fixer) {
            const sourceCode = context.getSourceCode();
            const hasSemicolon = sourceCode.text[node.range[1]] === ';';

            if (hasSemicolon) {
              return fixer.replaceTextRange(
                [node.range[0], node.range[1] + 1],
                'driver.wait(until.elementLocated(By.id(\'element\'))); // TODO: Add condition'
              );
            } else {
              return fixer.replaceText(
                node,
                'driver.wait(until.elementLocated(By.id(\'element\'))); // TODO: Add condition'
              );
            }
          }
        });
      }
    }

    function checkSleepPatterns(node) {
      // Skip if it's an allowed method
      if (isAllowedMethod(node)) return;

      // Check for various sleep/delay/wait patterns
      if (node.callee.type === 'Identifier') {
        const name = node.callee.name;
        if (/^(sleep|delay|wait|pause)$/i.test(name)) {
          // Check if first argument is a number
          const arg = node.arguments[0];
          if (arg && (arg.type === 'Literal' && typeof arg.value === 'number')) {
            // Check timeout value
            if (checkTimeoutValue(node, arg.value)) return;

            // Skip the regular error if in setup hook and allowed
            if (isInSetupHook(node)) return;

            context.report({
              node,
              messageId: 'useWaitFor'
            });
          }
        }
      }

      // Check for Thread.sleep
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Thread' &&
          node.callee.property.name === 'sleep') {
        // Check timeout value if it's a literal
        const timeoutArg = node.arguments[0];
        if (timeoutArg && timeoutArg.type === 'Literal' && typeof timeoutArg.value === 'number') {
          if (checkTimeoutValue(node, timeoutArg.value)) return;
        }

        // Skip the regular error if in setup hook and allowed
        if (isInSetupHook(node)) return;

        context.report({
          node,
          messageId: 'avoidUnconditionalWait'
        });
      }
    }

    return {
      CallExpression(node) {
        checkWaitWithoutCondition(node);
        checkSetTimeout(node);
        checkSetInterval(node);
        checkWaitForWithoutAssertion(node);
        checkPlaywrightWaitForTimeout(node);
        checkBrowserPause(node);
        checkDriverSleep(node);
        checkSleepPatterns(node);
      },

      AwaitExpression(node) {
        if (node.argument) {
          // Pass the entire await expression for proper fix context
          checkPromiseWithTimeout(node.argument, node);
        }
      }
    };
  }
};
