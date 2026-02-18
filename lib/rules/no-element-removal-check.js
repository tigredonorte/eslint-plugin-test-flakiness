/**
 * @fileoverview Rule to avoid checking for element removal which can have timing issues
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, getFilename, findEnclosingFunction, ensureAsyncFunction, addWaitForImport } = require('../utils/helpers');

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
      useWaitForRemoval: 'Avoid checking for null/undefined without proper waiting. Wrap in waitFor() to handle timing.',
      avoidNotInDocument: 'Avoid .not.toBeInTheDocument() without proper waiting.',
      avoidNotVisibleWithoutWaitFor: 'Avoid .not.toBeVisible() without proper waiting. Wrap in waitFor() to handle timing.'
    }
  },

  create(context) {
    if (!isTestFile(getFilename(context))) {
      return {};
    }

    function isInsideWaitFor(node) {
      let parent = node.parent;
      while (parent && parent.type !== 'Program') {
        if (parent.type === 'CallExpression') {
          const calleeName = parent.callee.name ||
            (parent.callee.property && parent.callee.property.name);
          if (calleeName === 'waitFor' || calleeName === 'waitForElementToBeRemoved') {
            return true;
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    function createWaitForFix(node) {
      return function(fixer) {
        const sourceCode = context.getSourceCode();
        // Find the containing expression statement
        let statement = node.parent;
        while (statement && statement.type !== 'ExpressionStatement') {
          statement = statement.parent;
        }
        if (!statement || !statement.expression) return null;

        const importFixes = addWaitForImport(fixer, context);
        if (importFixes === null) return null; // Skip fix for incompatible frameworks

        const funcNode = findEnclosingFunction(node);
        const asyncFixes = ensureAsyncFunction(fixer, funcNode);
        if (asyncFixes === null) return null; // Skip fix for getters/setters/constructors

        const statementText = sourceCode.getText(statement.expression);

        return [
          fixer.replaceText(
            statement,
            `await waitFor(() => { ${statementText}; });`
          ),
          ...asyncFixes,
          ...importFixes
        ];
      };
    }

    function checkNotToBeInTheDocument(node) {
      // Check for expect().not.toBeInTheDocument() patterns
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'toBeInTheDocument') {

        const expectCall = node.callee.object;
        if (expectCall.type === 'MemberExpression' &&
            expectCall.property.name === 'not') {

          if (!isInsideWaitFor(node)) {
            context.report({
              node,
              messageId: 'avoidNotInDocument',
              fix: createWaitForFix(node)
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

            // Enhanced detection for query methods including screen.queryByX patterns
            const isQueryMethod = queryName && /^query/.test(queryName);
            const isScreenQuery = arg.callee.type === 'MemberExpression' &&
                                arg.callee.object &&
                                arg.callee.object.name === 'screen' &&
                                arg.callee.property &&
                                /^query/.test(arg.callee.property.name);
            const isContainerQuery = arg.callee.type === 'MemberExpression' &&
                                   arg.callee.property &&
                                   (/^query/.test(arg.callee.property.name) || arg.callee.property.name === 'querySelector');

            if ((isQueryMethod || isScreenQuery || isContainerQuery) && !isInsideWaitFor(node)) {
              context.report({
                node,
                messageId: 'useWaitForRemoval',
                fix: createWaitForFix(node)
              });
            }
          }
        }
      }
    }

    function checkNotToBeDefined(node) {
      // Check for expect().not.toBeDefined() patterns
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'toBeDefined') {

        const expectCall = node.callee.object;
        if (expectCall.type === 'MemberExpression' &&
            expectCall.property.name === 'not') {

          const baseExpectCall = expectCall.object;
          if (baseExpectCall.type === 'CallExpression' &&
              baseExpectCall.callee.name === 'expect') {

            const arg = baseExpectCall.arguments[0];
            if (arg && arg.type === 'CallExpression') {
              const queryName = arg.callee.name ||
                              (arg.callee.property && arg.callee.property.name);

              // Enhanced detection for query methods including screen.queryByX patterns
              const isQueryMethod = queryName && /^query/.test(queryName);
              const isScreenQuery = arg.callee.type === 'MemberExpression' &&
                                  arg.callee.object &&
                                  arg.callee.object.name === 'screen' &&
                                  arg.callee.property &&
                                  /^query/.test(arg.callee.property.name);

              if ((isQueryMethod || isScreenQuery) && !isInsideWaitFor(node)) {
                context.report({
                  node,
                  messageId: 'useWaitForRemoval',
                  fix: createWaitForFix(node)
                });
              }
            }
          }
        }
      }
    }

    function checkDirectNullChecks(node) {
      // Check for direct null checks like if (element === null)
      if (node.type === 'BinaryExpression' &&
          (node.operator === '===' || node.operator === '==' || node.operator === '!=' || node.operator === '!==') &&
          ((node.left.type === 'Literal' && node.left.value === null) ||
           (node.right.type === 'Literal' && node.right.value === null))) {

        // Check if this involves a query method result
        const nonNullSide = node.left.type === 'Literal' ? node.right : node.left;
        if (nonNullSide.type === 'CallExpression') {
          const queryName = nonNullSide.callee.name ||
                          (nonNullSide.callee.property && nonNullSide.callee.property.name);

          if (queryName && /^query/.test(queryName)) {
            context.report({
              node,
              messageId: 'useWaitForRemoval'
            });
          }
        }
      }
    }

    function checkVisibilityAfterRemoval(node) {
      // Check for expect(element).not.toBeVisible() patterns
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'toBeVisible') {

        const expectCall = node.callee.object;
        if (expectCall.type === 'MemberExpression' &&
            expectCall.property.name === 'not') {

          if (!isInsideWaitFor(node)) {
            context.report({
              node,
              messageId: 'avoidNotVisibleWithoutWaitFor',
              fix: createWaitForFix(node)
            });
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
        checkNotToBeInTheDocument(node);
        checkQueryReturnsNull(node);
        checkNotToBeDefined(node);
        checkVisibilityAfterRemoval(node);
      },
      UnaryExpression(node) {
        checkDocumentContains(node);
      },
      BinaryExpression(node) {
        checkDirectNullChecks(node);
      }
    };
  }
};
