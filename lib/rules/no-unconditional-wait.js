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
    schema: [],
    messages: {
      avoidUnconditionalWait: 'Avoid unconditional wait. Wait for specific conditions instead.',
      useWaitFor: 'Use waitFor() with an assertion instead of fixed delay.',
      useDataTestId: 'Wait for specific elements or conditions instead of arbitrary delays.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    function checkWaitWithoutCondition(node) {
      // Check for cy.wait(number) without alias
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'cy' &&
          node.callee.property.name === 'wait') {

        const arg = node.arguments[0];
        if (arg && arg.type === 'Literal' && typeof arg.value === 'number') {
          context.report({
            node,
            messageId: 'avoidUnconditionalWait',
            fix(fixer) {
              return fixer.replaceText(
                node,
                'cy.wait(\'@apiCall\') // TODO: Replace with actual alias or remove wait'
              );
            }
          });
        }
      }
    }

    function checkSetTimeout(node) {
      // Check for setTimeout with fixed delays
      if (node.callee.name === 'setTimeout' ||
          (node.callee.type === 'MemberExpression' &&
           node.callee.property.name === 'setTimeout')) {

        if (!isInMockContext(node, context)) {
          // Check if it's part of a polling pattern
          let parent = node.parent;
          while (parent) {
            const sourceCode = context.getSourceCode();
            const parentText = sourceCode.getText(parent);
            // If it's part of a conditional check or polling, it's valid
            if (/if\s*\(.*\)|check|poll|retry|clearInterval/.test(parentText)) {
              return;
            }
            // Don't traverse too far up
            if (parent.type === 'FunctionDeclaration' ||
                parent.type === 'FunctionExpression' ||
                parent.type === 'ArrowFunctionExpression') {
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
      // Check for setInterval without clear condition
      if (node.callee.name === 'setInterval') {
        if (!isInMockContext(node, context)) {
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

    function checkPromiseWithTimeout(node) {
      // Check for new Promise with only setTimeout
      if (node.callee.type === 'NewExpression' &&
          node.callee.callee.name === 'Promise') {

        const arg = node.callee.arguments[0];
        if (arg && arg.type === 'ArrowFunctionExpression') {
          const body = arg.body;

          // Check if body is just setTimeout
          if (body.type === 'CallExpression' &&
              body.callee.name === 'setTimeout') {

            // Check if it's a simple timeout (resolve => setTimeout(resolve, n))
            const setTimeoutFirstArg = body.arguments[0];
            if (setTimeoutFirstArg &&
                setTimeoutFirstArg.type === 'Identifier' &&
                arg.params[0] &&
                arg.params[0].type === 'Identifier' &&
                setTimeoutFirstArg.name === arg.params[0].name) {
              context.report({
                node,
                messageId: 'useWaitFor',
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    'waitFor(() => {\n  // TODO: Add assertion or condition\n  expect(true).toBe(true);\n})'
                  );
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
      // Check for page.waitForTimeout() in Playwright
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        const obj = context.getSourceCode().getText(node.callee.object);

        if (method === 'waitForTimeout' && /page|frame|context/.test(obj)) {
          context.report({
            node,
            messageId: 'avoidUnconditionalWait',
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${obj}.waitForSelector('[data-testid="element"]'); // TODO: Replace with actual selector`
              );
            }
          });
        }
      }
    }

    function checkBrowserPause(node) {
      // Check for browser.pause() in WebdriverIO
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'browser' &&
          node.callee.property.name === 'pause') {

        context.report({
          node,
          messageId: 'avoidUnconditionalWait',
          fix(fixer) {
            return fixer.replaceText(
              node,
              'browser.waitUntil(() => element.isDisplayed()); // TODO: Add condition'
            );
          }
        });
      }
    }

    function checkDriverSleep(node) {
      // Check for driver.sleep() in Selenium
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'driver' &&
          node.callee.property.name === 'sleep') {

        context.report({
          node,
          messageId: 'avoidUnconditionalWait',
          fix(fixer) {
            return fixer.replaceText(
              node,
              'driver.wait(until.elementLocated(By.id(\'element\'))); // TODO: Add condition'
            );
          }
        });
      }
    }

    function checkSleepPatterns(node) {
      // Check for various sleep/delay/wait patterns
      if (node.callee.type === 'Identifier') {
        const name = node.callee.name;
        if (/^(sleep|delay|wait|pause)$/i.test(name)) {
          // Check if first argument is a number
          const arg = node.arguments[0];
          if (arg && (arg.type === 'Literal' && typeof arg.value === 'number')) {
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
        checkPromiseWithTimeout(node);
        checkWaitForWithoutAssertion(node);
        checkPlaywrightWaitForTimeout(node);
        checkBrowserPause(node);
        checkDriverSleep(node);
        checkSleepPatterns(node);
      },

      AwaitExpression(node) {
        if (node.argument && node.argument.type === 'CallExpression') {
          checkPromiseWithTimeout(node.argument);
        }
      }
    };
  }
};
