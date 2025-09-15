/**
 * @fileoverview Rule to avoid checking for element removal which can have timing issues
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid checking for element removal as timing can vary',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-element-removal-check.md'
    },
    fixable: 'code',
    schema: [],
    messages: {
      avoidRemovalCheck: 'Checking for element removal can be flaky. Use waitForElementToBeRemoved or wait for a positive condition instead.',
      useWaitForRemoval: 'Use waitForElementToBeRemoved() instead of checking for null/undefined.',
      avoidNotInDocument: 'Avoid .not.toBeInTheDocument() without proper waiting.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    function checkWaitForElementToBeRemoved(node) {
      // Check for waitForElementToBeRemoved usage (this is actually OK, but we want to ensure it's used correctly)
      if (node.callee.name === 'waitForElementToBeRemoved') {
        // This is fine, but check if timeout is too short
        const options = node.arguments[1];
        if (options && options.type === 'ObjectExpression') {
          const timeout = options.properties.find(p => p.key.name === 'timeout');
          if (timeout && timeout.value.value < 1000) {
            context.report({
              node,
              messageId: 'avoidRemovalCheck'
            });
          }
        }
      }
    }

    function checkNotToBeInTheDocument(node) {
      // Check for expect().not.toBeInTheDocument() patterns
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'toBeInTheDocument') {
        
        const expectCall = node.callee.object;
        if (expectCall.type === 'MemberExpression' &&
            expectCall.property.name === 'not') {
          
          // Check if it's wrapped in waitFor
          let parent = node.parent;
          let insideWaitFor = false;
          
          while (parent && parent.type !== 'Program') {
            if (parent.type === 'CallExpression' &&
                (parent.callee.name === 'waitFor' ||
                 parent.callee.name === 'waitForElementToBeRemoved')) {
              insideWaitFor = true;
              break;
            }
            parent = parent.parent;
          }
          
          if (!insideWaitFor) {
            context.report({
              node,
              messageId: 'avoidNotInDocument',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const expectStatement = sourceCode.getText(node.parent);
                return fixer.replaceText(
                  node.parent,
                  'await waitForElementToBeRemoved(() => screen.queryByTestId(\'element\'))'
                );
              }
            });
          }
        }
      }
    }

    function checkQueryReturnsNull(node) {
      // Check for patterns like expect(queryByX()).toBeNull()
      if (node.callee.type === 'MemberExpression' &&
          (node.callee.property.name === 'toBeNull' ||
           node.callee.property.name === 'toBeUndefined' ||
           node.callee.property.name === 'toBeFalsy')) {
        
        const expectCall = node.callee.object;
        if (expectCall.type === 'CallExpression' &&
            expectCall.callee.name === 'expect') {
          
          const arg = expectCall.arguments[0];
          if (arg && arg.type === 'CallExpression') {
            const queryName = arg.callee.name || 
                            (arg.callee.property && arg.callee.property.name);
            
            if (queryName && /^query/.test(queryName)) {
              context.report({
                node,
                messageId: 'useWaitForRemoval',
                fix(fixer) {
                  return fixer.replaceText(
                    node.parent,
                    `await waitForElementToBeRemoved(() => ${context.getSourceCode().getText(arg)})`
                  );
                }
              });
            }
          }
        }
      }
    }

    function checkDocumentContains(node) {
      // Check for !document.contains(element) patterns
      if (node.type === 'UnaryExpression' &&
          node.operator === '!' &&
          node.argument.type === 'CallExpression') {
        
        const call = node.argument;
        if (call.callee.type === 'MemberExpression' &&
            call.callee.object.name === 'document' &&
            call.callee.property.name === 'contains') {
          
          context.report({
            node,
            messageId: 'avoidRemovalCheck'
          });
        }
      }
    }

    return {
      CallExpression(node) {
        checkWaitForElementToBeRemoved(node);
        checkNotToBeInTheDocument(node);
        checkQueryReturnsNull(node);
      },
      UnaryExpression(node) {
        checkDocumentContains(node);
      }
    };
  }
};
