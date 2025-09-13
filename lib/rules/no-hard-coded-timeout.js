/**
 * @fileoverview Rule to disallow hard-coded timeouts in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext } = require('../utils/helpers');

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
      avoidSetInterval: 'Avoid setInterval in tests. Use polling with waitFor() instead.',
      avoidPromiseTimeout: 'Avoid Promise-based timeouts. Use waitFor() utilities instead.',
      avoidCypressWait: 'Avoid cy.wait() with fixed delays. Use cy.intercept() or cy.wait(@alias) instead.'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const maxTimeout = options.maxTimeout || 1000;
    const allowInSetup = options.allowInSetup || false;
    
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    function checkSetTimeout(node) {
      // Skip if in mock context (jest.setTimeout, vi.setTimeout)
      if (isInMockContext(node, context)) {
        return;
      }

      // Check for setTimeout with numeric delay
      if (node.callee.name === 'setTimeout' || 
          (node.callee.type === 'MemberExpression' && 
           node.callee.property.name === 'setTimeout')) {
        
        const delayArg = node.arguments[1];
        if (delayArg && delayArg.type === 'Literal' && 
            typeof delayArg.value === 'number' && 
            delayArg.value >= maxTimeout) {
          
          // Skip if in setup/teardown and allowed
          if (allowInSetup && isInSetupTeardown(node)) {
            return;
          }

          context.report({
            node: delayArg,
            messageId: 'avoidHardTimeout',
            data: { timeout: delayArg.value },
            fix(fixer) {
              // Suggest waitFor pattern
              const callback = context.getSourceCode().getText(node.arguments[0]);
              return fixer.replaceText(
                node,
                `await waitFor(() => {\n  ${callback}\n}, { timeout: ${delayArg.value} })`
              );
            }
          });
        }
      }
    }

    function checkSetInterval(node) {
      if (node.callee.name === 'setInterval' || 
          (node.callee.type === 'MemberExpression' && 
           node.callee.property.name === 'setInterval')) {
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'avoidSetInterval'
          });
        }
      }
    }

    function checkPromiseTimeout(node) {
      // Check for: new Promise(resolve => setTimeout(resolve, n))
      if (node.callee.name === 'Promise' && 
          node.arguments[0] && 
          node.arguments[0].type === 'ArrowFunctionExpression') {
        
        const body = node.arguments[0].body;
        if (body.type === 'CallExpression' && 
            body.callee.name === 'setTimeout') {
          
          const delayArg = body.arguments[1];
          if (delayArg && delayArg.type === 'Literal' && 
              delayArg.value >= maxTimeout) {
            
            context.report({
              node,
              messageId: 'avoidPromiseTimeout',
              fix(fixer) {
                return fixer.replaceText(
                  node,
                  `waitFor(() => expect(true).toBe(true), { timeout: ${delayArg.value} })`
                );
              }
            });
          }
        }
      }
    }

    function checkCypressWait(node) {
      // Check for cy.wait(number)
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'cy' &&
          node.callee.property.name === 'wait' &&
          node.arguments[0] &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'number') {
        
        context.report({
          node,
          messageId: 'avoidCypressWait'
        });
      }
    }

    function checkWaitHelpers(node) {
      // Check for common wait/delay/sleep helpers
      const functionName = node.callee.name;
      if (functionName && /^(wait|delay|sleep|pause)$/i.test(functionName)) {
        const delayArg = node.arguments[0];
        if (delayArg && delayArg.type === 'Literal' && 
            typeof delayArg.value === 'number' && 
            delayArg.value >= maxTimeout) {
          
          context.report({
            node,
            messageId: 'avoidHardTimeout',
            data: { timeout: delayArg.value }
          });
        }
      }
    }

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