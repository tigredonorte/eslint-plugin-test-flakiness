/**
 * @fileoverview Rule to prevent focus-dependent assertions that can be affected by timing
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent focus-dependent assertions that can be affected by timing and environment',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-focus-check.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowWithWaitFor: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidFocusCheck: 'Focus checks can be flaky. Wrap in waitFor() or avoid if possible.',
      useWaitForFocus: 'Use waitFor() when checking focus state.',
      avoidActiveElement: 'document.activeElement checks are timing-dependent.',
      avoidBlurCheck: 'Blur checks can be affected by timing.',
      focusTrapWarning: 'Focus trap testing can be environment-dependent.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowWithWaitFor = options.allowWithWaitFor !== false;

    function isInsideWaitFor(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression' &&
            (parent.callee.name === 'waitFor' ||
             parent.callee.name === 'waitForElement')) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    function checkFocusAssertion(node) {
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        // Check for toHaveFocus, toBeFocused assertions
        if (method === 'toHaveFocus' || 
            method === 'toBeFocused' ||
            method === 'toHaveFocusedElement') {
          
          if (allowWithWaitFor && isInsideWaitFor(node)) {
            return;
          }
          
          context.report({
            node,
            messageId: 'avoidFocusCheck',
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              const statement = node.parent;
              const statementText = sourceCode.getText(statement);
              
              return fixer.replaceText(
                statement,
                `await waitFor(() => ${statementText})`
              );
            }
          });
        }
        
        // Check for not.toHaveFocus (blur checks)
        if (method === 'toHaveFocus' || method === 'toBeFocused') {
          const expectCall = node.callee.object;
          if (expectCall.type === 'MemberExpression' &&
              expectCall.property.name === 'not') {
            
            if (!isInsideWaitFor(node)) {
              context.report({
                node,
                messageId: 'avoidBlurCheck'
              });
            }
          }
        }
      }
    }

    function checkActiveElement(node) {
      // Check for document.activeElement
      if (node.type === 'MemberExpression' &&
          node.object.name === 'document' &&
          node.property.name === 'activeElement') {
        
        // Check if it's being compared in an assertion
        let parent = node.parent;
        while (parent && parent.type !== 'Program') {
          if (parent.type === 'CallExpression' &&
              parent.callee.name === 'expect') {
            
            if (allowWithWaitFor && isInsideWaitFor(parent)) {
              return;
            }
            
            context.report({
              node,
              messageId: 'avoidActiveElement',
              fix(fixer) {
                // Find the expect statement
                let expectStatement = parent;
                while (expectStatement.parent && 
                       expectStatement.parent.type !== 'ExpressionStatement') {
                  expectStatement = expectStatement.parent;
                }
                
                const sourceCode = context.getSourceCode();
                const statementText = sourceCode.getText(expectStatement.parent || expectStatement);
                
                return fixer.replaceText(
                  expectStatement.parent || expectStatement,
                  `await waitFor(() => ${statementText})`
                );
              }
            });
            break;
          }
          parent = parent.parent;
        }
      }
    }

    function checkFocusMethods(node) {
      // Check for .focus() and .blur() calls
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        if (method === 'focus' || method === 'blur') {
          const sourceCode = context.getSourceCode();
          const objectText = sourceCode.getText(node.callee.object);
          
          // Check if it looks like a DOM element (not a mock)
          if (!/mock|stub|spy|jest\.fn/.test(objectText)) {
            // Check if there's an immediate assertion after
            const parent = node.parent;
            if (parent && parent.type === 'ExpressionStatement') {
              const block = parent.parent;
              if (block && block.type === 'BlockStatement') {
                const index = block.body.indexOf(parent);
                const nextStatement = block.body[index + 1];
                
                if (nextStatement) {
                  const nextSource = sourceCode.getText(nextStatement);
                  if (/expect.*focus|activeElement/.test(nextSource)) {
                    context.report({
                      node: nextStatement,
                      messageId: 'useWaitForFocus'
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    function checkFocusTrap(node) {
      // Check for focus trap testing patterns
      if (node.callee.type === 'Identifier' || 
          node.callee.type === 'MemberExpression') {
        
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText(node);
        
        // Common focus trap patterns
        if (/focusTrap|trapFocus|createFocusTrap/.test(text)) {
          context.report({
            node,
            messageId: 'focusTrapWarning'
          });
        }
      }
    }

    function checkTabIndex(node) {
      // Check for tabIndex checks which might be focus-related
      if (node.type === 'MemberExpression' &&
          node.property.name === 'tabIndex') {
        
        // Check if it's in an assertion
        let parent = node.parent;
        while (parent && parent.type !== 'Program') {
          if (parent.type === 'CallExpression') {
            const callee = parent.callee;
            if (callee.type === 'MemberExpression' &&
                /^to(Be|Equal|Have)/.test(callee.property.name)) {
              
              if (!isInsideWaitFor(parent)) {
                context.report({
                  node,
                  messageId: 'avoidFocusCheck'
                });
              }
              break;
            }
          }
          parent = parent.parent;
        }
      }
    }

    function checkAriaAttributes(node) {
      // Check for aria-focused and similar attributes
      if (node.type === 'Literal' && typeof node.value === 'string') {
        if (node.value === 'aria-focused' || 
            node.value === 'aria-activedescendant') {
          
          // Check if it's in a getAttribute or hasAttribute call
          const parent = node.parent;
          if (parent && parent.type === 'CallExpression') {
            const callee = parent.callee;
            if (callee.type === 'MemberExpression' &&
                (callee.property.name === 'getAttribute' ||
                 callee.property.name === 'hasAttribute')) {
              
              if (!isInsideWaitFor(parent)) {
                context.report({
                  node: parent,
                  messageId: 'avoidFocusCheck'
                });
              }
            }
          }
        }
      }
    }

    return {
      CallExpression(node) {
        checkFocusAssertion(node);
        checkFocusMethods(node);
        checkFocusTrap(node);
      },
      MemberExpression(node) {
        checkActiveElement(node);
        checkTabIndex(node);
      },
      Literal(node) {
        checkAriaAttributes(node);
      }
    };
  }
};
