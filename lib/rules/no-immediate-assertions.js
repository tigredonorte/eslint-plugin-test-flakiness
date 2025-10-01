/**
 * @fileoverview Rule to prevent assertions immediately after state changes
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent assertions immediately after state changes without waiting',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-immediate-assertions.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedAfterOperations: {
            type: 'array',
            items: {
              type: 'string'
            },
            default: []
          },
          requireWaitFor: {
            type: 'boolean',
            default: true
          },
          ignoreDataTestId: {
            type: 'boolean',
            default: false
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      needsWaitFor: 'Assertion immediately after {{action}} needs waitFor() wrapper',
      needsWaitForState: 'State assertion after {{action}} should use waitFor()',
      needsWaitForDom: 'DOM assertion after action should use waitFor() or findBy query'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    // Get configuration options
    const options = context.options[0] || {};
    const allowedAfterOperations = options.allowedAfterOperations || [];
    const requireWaitFor = options.requireWaitFor !== false; // default true
    const ignoreDataTestId = options.ignoreDataTestId || false;

    const stateChangingPatterns = [
      'setState', 'setProps', 'dispatch', 'commit',
      'click', 'type', 'change', 'submit', 'fireEvent',
      'userEvent', 'simulate', 'trigger'
    ];

    function isStateChangingAction(node) {
      if (node.type !== 'CallExpression') {
        return false;
      }

      const callee = node.callee;

      // Direct function calls
      if (callee.type === 'Identifier') {
        // Check if this operation is in the allowed list
        if (allowedAfterOperations.includes(callee.name)) {
          return false;
        }
        return stateChangingPatterns.some(pattern =>
          callee.name.includes(pattern)
        );
      }

      // Method calls
      if (callee.type === 'MemberExpression') {
        const method = callee.property.name;
        const object = callee.object.name;

        // Check if this operation is in the allowed list
        if (method && allowedAfterOperations.includes(method)) {
          return false;
        }
        if (object && method && allowedAfterOperations.includes(`${object}.${method}`)) {
          return false;
        }

        // Check for patterns like fireEvent.click, userEvent.type
        if (stateChangingPatterns.includes(object)) {
          return true;
        }
        if (stateChangingPatterns.includes(method)) {
          return true;
        }

        // Check for setState, setProps, etc.
        if (method && stateChangingPatterns.some(p => method.includes(p))) {
          return true;
        }
      }

      return false;
    }

    function isExpectCall(node) {
      if (node.type !== 'CallExpression') {
        return false;
      }

      // Direct expect()
      if (node.callee.name === 'expect') {
        return true;
      }

      // Chained expect().toBe()
      let current = node;
      while (current.callee && current.callee.type === 'MemberExpression') {
        if (current.callee.object.type === 'CallExpression' &&
            current.callee.object.callee.name === 'expect') {
          return true;
        }
        current = current.callee.object;
      }

      return false;
    }

    function isInsideWaitFor(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression') {
          const calleeName = parent.callee.name || 
                           (parent.callee.property && parent.callee.property.name);
          if (calleeName === 'waitFor' || 
              calleeName === 'waitForElement' ||
              calleeName === 'wait') {
            return true;
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    function hasDataTestIdQuery(node) {
      if (!ignoreDataTestId) return false;

      // Check if the assertion uses getByTestId or queryByTestId
      const sourceCode = context.getSourceCode().getText(node);
      return /getByTestId|queryByTestId|findByTestId|data-testid/i.test(sourceCode);
    }

    function checkSequentialStatements(node) {
      // Only check within block statements, program body, or arrow function expressions
      if (node.parent.type !== 'BlockStatement' &&
          node.parent.type !== 'Program' &&
          !(node.parent.type === 'ArrowFunctionExpression' && node.parent.body === node)) {
        return;
      }

      let statements;
      let currentIndex;

      if (node.parent.type === 'ArrowFunctionExpression') {
        // For arrow functions with expression body, we can't have sequential statements
        return;
      } else {
        statements = node.parent.body;
        currentIndex = statements.indexOf(node);
      }

      // Check if current node is a state-changing action
      if (node.type !== 'ExpressionStatement' ||
          !isStateChangingAction(node.expression)) {
        return;
      }

      // Check the next statement
      const nextStatement = statements[currentIndex + 1];
      if (!nextStatement ||
          nextStatement.type !== 'ExpressionStatement' ||
          !isExpectCall(nextStatement.expression) ||
          isInsideWaitFor(nextStatement.expression)) {
        return;
      }

      // Skip if requireWaitFor is false
      if (!requireWaitFor) {
        return;
      }

      // Skip if ignoreDataTestId is true and assertion uses data-testid
      if (hasDataTestIdQuery(nextStatement.expression)) {
        return;
      }

      const actionName = getActionName(node.expression);
      const sourceCode = context.getSourceCode().getText(nextStatement.expression);

      // Determine message based on what's being tested
      let messageId = 'needsWaitFor';
      if (node.expression && node.expression.callee) {
        // Check if it's a direct setState call
        if (node.expression.callee.type === 'Identifier' && node.expression.callee.name === 'setState') {
          if (/state/i.test(sourceCode)) {
            messageId = 'needsWaitForState';
          }
        }
        // Check if it's a method call
        else if (node.expression.callee.type === 'MemberExpression') {
          const method = node.expression.callee.property && node.expression.callee.property.name;
          if ((method === 'setState' || method === 'dispatch' || method === 'commit' || method === 'setProps') &&
              /state|store|props/i.test(sourceCode)) {
            messageId = 'needsWaitForState';
          }
        }
      }

      context.report({
        node: nextStatement,
        messageId,
        data: { action: actionName },
        fix(fixer) {
          const expectCode = context.getSourceCode().getText(nextStatement);
          const indentation = getIndentation(nextStatement);

          return fixer.replaceText(
            nextStatement,
            `waitFor(() => {\n${indentation}  ${expectCode}\n${indentation}});`
          );
        }
      });
    }

    function getActionName(node) {
      if (node.type === 'AwaitExpression') {
        node = node.argument;
      }
      
      if (node.callee) {
        if (node.callee.type === 'Identifier') {
          return node.callee.name;
        }
        if (node.callee.type === 'MemberExpression') {
          const object = node.callee.object.name || 'action';
          const method = node.callee.property.name;
          return `${object}.${method}`;
        }
      }
      
      return 'action';
    }

    function getIndentation(node) {
      const source = context.getSourceCode();
      const token = source.getFirstToken(node);
      const lineStart = source.getLines()[token.loc.start.line - 1].match(/^\s*/);
      return lineStart ? lineStart[0] : '';
    }

    function checkInlinePattern(node) {
      // Check for patterns like: fireEvent.click(btn); expect(...)
      if (node.type !== 'ExpressionStatement' ||
          node.expression.type !== 'SequenceExpression') {
        return;
      }

      const expressions = node.expression.expressions;
      for (let i = 0; i < expressions.length - 1; i++) {
        if (!isStateChangingAction(expressions[i]) ||
            !isExpectCall(expressions[i + 1])) {
          continue;
        }

        // Skip if requireWaitFor is false
        if (!requireWaitFor) {
          continue;
        }

        // Skip if ignoreDataTestId is true and assertion uses data-testid
        if (hasDataTestIdQuery(expressions[i + 1])) {
          continue;
        }

        context.report({
          node: expressions[i + 1],
          messageId: 'needsWaitForDom'
        });
      }
    }

    return {
      ExpressionStatement(node) {
        checkSequentialStatements(node);
        checkInlinePattern(node);
      },
      
      // Check for setState/dispatch followed by immediate state/store checks
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return;
        }

        const method = node.callee.property.name;

        // Check for setState or dispatch
        if (method !== 'setState' && method !== 'dispatch') {
          return;
        }

        // Look for immediate expect on the next line
        const parent = node.parent;
        if (!parent || parent.type !== 'ExpressionStatement') {
          return;
        }

        const blockParent = parent.parent;
        if (!blockParent || blockParent.type !== 'BlockStatement') {
          return;
        }

        const index = blockParent.body.indexOf(parent);
        const next = blockParent.body[index + 1];

        if (!next || next.type !== 'ExpressionStatement') {
          return;
        }

        const expr = next.expression;
        if (!isExpectCall(expr)) {
          return;
        }

        // Skip if requireWaitFor is false
        if (!requireWaitFor) {
          return;
        }

        // Skip if ignoreDataTestId is true and assertion uses data-testid
        if (hasDataTestIdQuery(expr)) {
          return;
        }

        // Check if it's testing state or store
        const sourceCode = context.getSourceCode().getText(expr);
        if (!/state|store|props/i.test(sourceCode)) {
          return;
        }

        context.report({
          node: next,
          messageId: 'needsWaitForState',
          data: { action: method }
        });
      }
    };
  }
};