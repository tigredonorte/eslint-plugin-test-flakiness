/**
 * @fileoverview Rule to disallow hard-coded timeouts in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext, getFilename, findEnclosingFunction, ensureAsyncFunction, addWaitForImport, getTestFramework } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hard-coded timeouts in tests',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-hard-coded-timeout.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          maxTimeout: {
            type: 'number',
            default: 1000
          },
          allowInSetup: {
            type: 'boolean',
            default: false
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidHardTimeout: 'Avoid hard-coded timeout of {{timeout}}ms. Use waitFor() or findBy queries instead.',
      avoidHardTimeoutPlaywright: 'Avoid hard-coded timeout of {{timeout}}ms. Use Playwright auto-retrying assertions or page.waitForSelector() instead.',
      avoidHardTimeoutCypress: 'Avoid hard-coded timeout of {{timeout}}ms. Use .should() with timeout option or cy.intercept() instead.',
      avoidSetInterval: 'Avoid setInterval in tests. Use polling with waitFor() instead.',
      avoidPromiseTimeout: 'Avoid Promise-based timeouts. Use waitFor() utilities instead.',
      avoidPromiseTimeoutPlaywright: 'Avoid Promise-based timeouts. Use Playwright auto-retrying assertions instead.',
      avoidPromiseTimeoutCypress: 'Avoid Promise-based timeouts. Use cy.intercept() and cy.wait(@alias) instead.',
      avoidCypressWait: 'Avoid cy.wait() with fixed delays. Use cy.intercept() or cy.wait(@alias) instead.'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const maxTimeout = options.maxTimeout || 1000;
    const allowInSetup = options.allowInSetup || false;

    if (!isTestFile(getFilename(context))) {
      return {};
    }

    function checkSetTimeout(node) {
      // Skip if in mock context (jest.setTimeout, vi.setTimeout)
      if (isInMockContext(node, context)) {
        return;
      }

      // Check for setTimeout with numeric delay
      const isSetTimeout = node.callee.name === 'setTimeout' ||
          (node.callee.type === 'MemberExpression' &&
           node.callee.property.name === 'setTimeout');

      if (!isSetTimeout) {
        return;
      }

      const delayArg = node.arguments[1];
      if (!delayArg || delayArg.type !== 'Literal' ||
          typeof delayArg.value !== 'number' ||
          delayArg.value < maxTimeout) {
        return;
      }

      // Skip if in setup/teardown and allowed
      if (allowInSetup && isInSetupTeardown(node)) {
        return;
      }

      const framework = getTestFramework(context);
      const timeoutMessageId = framework === 'playwright' ? 'avoidHardTimeoutPlaywright'
        : framework === 'cypress' ? 'avoidHardTimeoutCypress'
          : 'avoidHardTimeout';

      context.report({
        node: delayArg,
        messageId: timeoutMessageId,
        data: { timeout: delayArg.value },
        fix(fixer) {
          const importFixes = addWaitForImport(fixer, context);
          if (importFixes === null) return null; // Skip fix for incompatible frameworks

          // Suggest waitFor pattern
          const callbackNode = node.arguments[0];
          const callbackText = context.getSourceCode().getText(callbackNode);

          // Check if callback is already a function
          let waitForCallback;
          if (callbackNode.type === 'FunctionExpression' ||
              callbackNode.type === 'ArrowFunctionExpression') {
            // Extract the body of the function
            const bodyNode = callbackNode.body;
            if (bodyNode.type === 'BlockStatement') {
              // Get the inner content of the block without braces
              const sourceCode = context.getSourceCode();
              const bodyText = sourceCode.getText(bodyNode);
              // Remove the outer braces and trim
              const innerBody = bodyText.slice(1, -1).trim();
              waitForCallback = `async () => {\n  ${innerBody}\n}`;
            } else {
              // Arrow function with expression body
              const bodyText = context.getSourceCode().getText(bodyNode);
              waitForCallback = `async () => ${bodyText}`;
            }
          } else {
            // Not a function, wrap it
            waitForCallback = `async () => {\n  ${callbackText}\n}`;
          }

          const funcNode = findEnclosingFunction(node);
          return [
            fixer.replaceText(
              node,
              `await waitFor(${waitForCallback}, { timeout: ${delayArg.value} })`
            ),
            ...ensureAsyncFunction(fixer, funcNode),
            ...(importFixes || [])
          ];
        }
      });
    }

    function checkSetInterval(node) {
      const isSetInterval = node.callee.name === 'setInterval' ||
          (node.callee.type === 'MemberExpression' &&
           node.callee.property.name === 'setInterval');

      if (!isSetInterval) {
        return;
      }

      if (isInMockContext(node, context)) {
        return;
      }

      context.report({
        node,
        messageId: 'avoidSetInterval'
      });
    }

    function checkPromiseTimeout(node) {
      // Check for: new Promise(resolve => setTimeout(resolve, n))
      if (node.callee.name !== 'Promise') {
        return;
      }

      if (!node.arguments[0] || node.arguments[0].type !== 'ArrowFunctionExpression') {
        return;
      }

      const body = node.arguments[0].body;
      let setTimeoutCall = null;

      // Handle both expression body and block statement body
      if (body.type === 'CallExpression' && body.callee.name === 'setTimeout') {
        // Direct expression: resolve => setTimeout(resolve, n)
        setTimeoutCall = body;
      } else if (body.type === 'BlockStatement' && body.body && body.body.length === 1) {
        // Block with single statement: resolve => { setTimeout(resolve, n); }
        const stmt = body.body[0];
        if (stmt.type === 'ExpressionStatement' &&
            stmt.expression.type === 'CallExpression' &&
            stmt.expression.callee.name === 'setTimeout') {
          setTimeoutCall = stmt.expression;
        }
      }

      if (!setTimeoutCall) {
        return;
      }

      const delayArg = setTimeoutCall.arguments[1];
      if (!delayArg || delayArg.type !== 'Literal' || delayArg.value < maxTimeout) {
        return;
      }

      const promiseFramework = getTestFramework(context);
      const promiseMessageId = promiseFramework === 'playwright' ? 'avoidPromiseTimeoutPlaywright'
        : promiseFramework === 'cypress' ? 'avoidPromiseTimeoutCypress'
          : 'avoidPromiseTimeout';

      context.report({
        node,
        messageId: promiseMessageId,
        fix(fixer) {
          const importFixes = addWaitForImport(fixer, context);
          if (importFixes === null) return null; // Skip fix for incompatible frameworks

          // Check if parent is AwaitExpression
          const isAwaited = node.parent && node.parent.type === 'AwaitExpression';
          const targetNode = isAwaited ? node.parent : node;
          const funcNode = findEnclosingFunction(node);

          return [
            fixer.replaceText(
              targetNode,
              `await waitFor(() => expect(true).toBe(true), { timeout: ${delayArg.value} })`
            ),
            ...ensureAsyncFunction(fixer, funcNode),
            ...(importFixes || [])
          ];
        }
      });
    }

    function checkCypressWait(node) {
      // Check for cy.wait(number)
      if (node.callee.type !== 'MemberExpression' ||
          node.callee.object.name !== 'cy' ||
          node.callee.property.name !== 'wait') {
        return;
      }

      if (!node.arguments[0] ||
          node.arguments[0].type !== 'Literal' ||
          typeof node.arguments[0].value !== 'number') {
        return;
      }

      context.report({
        node,
        messageId: 'avoidCypressWait'
      });
    }

    function checkWaitHelpers(node) {
      // Check for common wait/delay/sleep helpers
      const functionName = node.callee.name;
      if (!functionName || !/^(wait|delay|sleep|pause)$/i.test(functionName)) {
        return;
      }

      const delayArg = node.arguments[0];
      if (!delayArg || delayArg.type !== 'Literal' ||
          typeof delayArg.value !== 'number' ||
          delayArg.value < maxTimeout) {
        return;
      }

      context.report({
        node,
        messageId: 'avoidHardTimeout',
        data: { timeout: delayArg.value }
      });
    }

    function isInSetupTeardown(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression' &&
            parent.callee.type === 'Identifier') {
          const name = parent.callee.name;
          if (/^(before|after)(Each|All)?$/.test(name)) {
            return true;
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    return {
      CallExpression(node) {
        checkSetTimeout(node);
        checkSetInterval(node);
        checkPromiseTimeout(node);
        checkCypressWait(node);
        checkWaitHelpers(node);
      },
      
      NewExpression(node) {
        checkPromiseTimeout(node);
      }
    };
  }
};