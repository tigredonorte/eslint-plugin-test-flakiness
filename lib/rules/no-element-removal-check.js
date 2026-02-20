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
      avoidNotVisibleWithoutWaitFor: 'Avoid .not.toBeVisible() without proper waiting. Wrap in waitFor() to handle timing.',
      avoidNotInDocumentNoEvidence: 'Element absence check without prior presence evidence. If the element was removed by an action, wrap in waitFor().',
      useWaitForRemovalNoEvidence: 'Element null/undefined check without prior presence evidence. If the element was removed by an action, wrap in waitFor().',
      avoidNotVisibleNoEvidence: 'Element not-visible check without prior presence evidence. If the element was hidden by an action, wrap in waitFor().'
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

    /**
     * Find the enclosing it()/test() block body as an array of statements.
     */
    function findTestBody(node) {
      let current = node.parent;
      while (current) {
        if (current.type === 'CallExpression' &&
            current.callee && current.callee.type === 'Identifier' &&
            (current.callee.name === 'it' || current.callee.name === 'test' || current.callee.name === 'specify')) {
          // The callback is the second argument (or first if no description)
          const callback = current.arguments[1] || current.arguments[0];
          if (callback && callback.body && callback.body.type === 'BlockStatement') {
            return callback.body.body;
          }
        }
        current = current.parent;
      }
      return null;
    }

    /**
     * Extract the query target text from an assertion node for matching.
     * Returns the literal string/regex argument of the query call, or null if unmatchable.
     */
    function extractQueryTarget(node) {
      // Walk up to find the expect() call
      let expectCall = null;
      let current = node;
      while (current) {
        if (current.type === 'CallExpression' && current.callee && current.callee.name === 'expect') {
          expectCall = current;
          break;
        }
        if (current.type === 'MemberExpression') {
          current = current.object;
          continue;
        }
        if (current.type === 'CallExpression' && current.callee) {
          current = current.callee;
          continue;
        }
        break;
      }

      if (!expectCall || !expectCall.arguments[0]) return null;
      const arg = expectCall.arguments[0];

      // arg should be a query call: queryByText('X'), screen.queryByRole('X')
      let queryCall = arg;
      if (queryCall.type !== 'CallExpression') return null;
      if (!queryCall.arguments[0]) return null;

      const firstArg = queryCall.arguments[0];
      if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
        return { type: 'string', value: firstArg.value };
      }
      if (firstArg.regex) {
        return { type: 'regex', pattern: firstArg.regex.pattern, flags: firstArg.regex.flags };
      }
      return null; // unmatchable (variable, template, function call)
    }

    /**
     * Check if a statement node contains a positive assertion or usage matching the given target.
     */
    function statementMatchesTarget(stmt, target) {
      const sourceCode = context.getSourceCode();
      const stmtText = sourceCode.getText(stmt);

      // Check for positive assertions: getByText('X'), getByRole('X'), etc.
      // or expect(getByText('X')).toBeInTheDocument()
      if (target.type === 'string') {
        // Look for getBy/findBy calls with the same string argument
        const escapedValue = target.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?:getBy|findBy)\\w+\\s*\\(\\s*['"]${escapedValue}['"]`);
        return pattern.test(stmtText);
      }
      if (target.type === 'regex') {
        const pattern = new RegExp(`(?:getBy|findBy)\\w+\\s*\\(\\s*/${target.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${target.flags}`);
        return pattern.test(stmtText);
      }
      return false;
    }

    /**
     * Check if there is evidence that an element was present and then removed.
     * Evidence = prior userEvent interaction + (optional) prior positive assertion on the same target.
     * fireEvent is sync so it's NOT evidence (element removed synchronously).
     */
    function hasRemovalEvidence(node) {
      const testBody = findTestBody(node);
      if (!testBody) return false;

      const target = extractQueryTarget(node);

      // Find the index of the current statement in the test body
      let currentStmt = node;
      while (currentStmt && currentStmt.parent && currentStmt.parent.type !== 'BlockStatement') {
        currentStmt = currentStmt.parent;
      }
      const currentIndex = testBody.indexOf(currentStmt);
      if (currentIndex === -1) return false; // Node not found in this block
      if (currentIndex === 0) return false;  // First statement — no prior evidence possible

      const sourceCode = context.getSourceCode();
      let hasUserEvent = false;
      let hasPositiveAssertion = false;

      for (let i = 0; i < currentIndex; i++) {
        const stmtText = sourceCode.getText(testBody[i]);
        if (/userEvent\.\w+\s*\(/.test(stmtText)) {
          hasUserEvent = true;
        }
        if (target && statementMatchesTarget(testBody[i], target)) {
          hasPositiveAssertion = true;
        }
      }

      // Evidence: userEvent interaction + either matchable target with positive assertion, or unmatchable target
      if (hasUserEvent && (!target || hasPositiveAssertion)) return true;
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
            if (hasRemovalEvidence(node)) {
              context.report({
                node,
                messageId: 'avoidNotInDocument',
                fix: createWaitForFix(node)
              });
            } else {
              context.report({
                node,
                messageId: 'avoidNotInDocumentNoEvidence'
              });
            }
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
              if (hasRemovalEvidence(node)) {
                context.report({
                  node,
                  messageId: 'useWaitForRemoval',
                  fix: createWaitForFix(node)
                });
              } else {
                context.report({
                  node,
                  messageId: 'useWaitForRemovalNoEvidence'
                });
              }
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
                if (hasRemovalEvidence(node)) {
                  context.report({
                    node,
                    messageId: 'useWaitForRemoval',
                    fix: createWaitForFix(node)
                  });
                } else {
                  context.report({
                    node,
                    messageId: 'useWaitForRemovalNoEvidence'
                  });
                }
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
            if (hasRemovalEvidence(node)) {
              context.report({
                node,
                messageId: 'useWaitForRemoval'
              });
            } else {
              context.report({
                node,
                messageId: 'useWaitForRemovalNoEvidence'
              });
            }
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
            if (hasRemovalEvidence(node)) {
              context.report({
                node,
                messageId: 'avoidNotVisibleWithoutWaitFor',
                fix: createWaitForFix(node)
              });
            } else {
              context.report({
                node,
                messageId: 'avoidNotVisibleNoEvidence'
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
