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
    const reportedNodes = new Set(); // Track reported nodes to avoid duplicates

    function isInsideWaitFor(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression' &&
            (parent.callee.name === 'waitFor' ||
             parent.callee.name === 'waitForElement' ||
             parent.callee.name === 'wait')) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    function reportOnce(node, messageId, fix) {
      const nodeKey = `${node.range[0]}-${node.range[1]}-${messageId}`;
      if (!reportedNodes.has(nodeKey)) {
        reportedNodes.add(nodeKey);
        const report = {
          node,
          messageId
        };
        if (fix) {
          report.fix = fix;
        }
        context.report(report);
      }
    }

    function hasMultipleStatementsOnLine(parent) {
      const sourceCode = context.getSourceCode();
      const lines = sourceCode.getLines();
      const startLine = parent.loc.start.line;
      const lineContent = lines[startLine - 1];
      return lineContent.includes(';') &&
             lineContent.trim().indexOf(';') !== lineContent.trim().length - 1;
    }

    function createWaitForFix(node) {
      return function(fixer) {
        const sourceCode = context.getSourceCode();
        // Find the containing expression statement
        let statement = node.parent;
        while (statement && statement.type !== 'ExpressionStatement') {
          statement = statement.parent;
        }
        if (statement) {
          const statementText = sourceCode.getText(statement.expression);
          return fixer.replaceText(
            statement,
            `await waitFor(() => ${statementText})`
          );
        }
      };
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

          reportOnce(node, 'avoidFocusCheck', createWaitForFix(node));
        }

        // Check for not.toHaveFocus (blur checks) - only if not inside waitFor or allowWithWaitFor is false
        if ((method === 'toHaveFocus' || method === 'toBeFocused') &&
            node.callee.object.type === 'MemberExpression' &&
            node.callee.object.property.name === 'not') {

          if (!allowWithWaitFor || !isInsideWaitFor(node)) {
            reportOnce(node, 'avoidFocusCheck', createWaitForFix(node));
            return; // Don't also report avoidBlurCheck for the same node
          }
        }
      }
    }

    function checkActiveElement(node) {
      // Check for document.activeElement
      if (node.type === 'MemberExpression' &&
          node.object.name === 'document' &&
          node.property.name === 'activeElement') {

        // Check if it's being used in an assertion
        let parent = node.parent;
        while (parent && parent.type !== 'Program') {
          if (parent.type === 'CallExpression' &&
              parent.callee.name === 'expect') {

            if (allowWithWaitFor && isInsideWaitFor(parent)) {
              return;
            }

            reportOnce(node, 'avoidActiveElement', function(fixer) {
              const sourceCode = context.getSourceCode();
              // Find the expect statement
              let expectStatement = parent;
              while (expectStatement.parent &&
                     expectStatement.parent.type !== 'ExpressionStatement') {
                expectStatement = expectStatement.parent;
              }

              const statement = expectStatement.parent || expectStatement;
              const statementText = sourceCode.getText(statement.type === 'ExpressionStatement' ? statement.expression : statement);

              return fixer.replaceText(
                statement,
                `await waitFor(() => ${statementText})`
              );
            });
            break;
          }
          parent = parent.parent;
        }
      }
    }

    function checkFocusMethods(node) {
      // Check for .focus() calls that need waiting when followed by assertions
      if (node.callee.type !== 'MemberExpression') {
        return;
      }

      const method = node.callee.property.name;

      if (method !== 'focus') {
        return;
      }

      const sourceCode = context.getSourceCode();
      const objectText = sourceCode.getText(node.callee.object);

      // Check if it looks like a DOM element (not a mock)
      if (/mock|stub|spy|jest\.fn/.test(objectText)) {
        return;
      }

      // Find the statement that contains this focus call
      let statementNode = node;
      while (statementNode.parent &&
              statementNode.parent.type !== 'Program' &&
              statementNode.parent.type !== 'BlockStatement' &&
              statementNode.parent.type !== 'SwitchCase') {
        statementNode = statementNode.parent;
      }

      // Special handling for IIFE - the statementNode might be a ReturnStatement in an IIFE
      // In that case, we need to find the CallExpression that represents the IIFE
      if (statementNode.type === 'ReturnStatement') {
        // Check if we're in an IIFE
        let current = statementNode.parent;
        while (current && current.type !== 'CallExpression') {
          if (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') {
            // Found a function, check if its parent is a CallExpression (IIFE)
            if (current.parent && current.parent.type === 'CallExpression') {
              statementNode = current.parent;
              break;
            }
          }
          current = current.parent;
        }
      }

      // Check if there's an immediate assertion after (for ExpressionStatement only)
      if (statementNode.type === 'ExpressionStatement') {
        const block = statementNode.parent;
        if (block && (block.type === 'BlockStatement' || block.type === 'Program')) {
          const statements = block.body;
          const index = statements.indexOf(statementNode);
          const nextStatement = statements[index + 1];

          if (nextStatement) {
            const nextSource = sourceCode.getText(nextStatement);
            if (/expect.*focus|activeElement/.test(nextSource)) {
              // Report on the focus call when followed by assertion
              reportOnce(node, 'useWaitForFocus', function(fixer) {
                const focusCall = sourceCode.getText(node);
                const hasMultipleStatements = hasMultipleStatementsOnLine(statementNode);

                if (hasMultipleStatements) {
                  return fixer.replaceText(statementNode, `await act(async () => { ${focusCall} });`);
                } else {
                  return fixer.replaceText(statementNode, `await act(async () => { ${focusCall} })`);
                }
              });
              return; // Avoid double reporting
            }
          }
        }

        // Report standalone focus calls in ExpressionStatement
        reportOnce(node, 'useWaitForFocus', function(fixer) {
          const focusCall = sourceCode.getText(node);
          const hasMultipleStatements = hasMultipleStatementsOnLine(statementNode);

          if (hasMultipleStatements) {
            return fixer.replaceText(statementNode, `await act(async () => { ${focusCall} });`);
          } else {
            return fixer.replaceText(statementNode, `await act(async () => { ${focusCall} })`);
          }
        });
        return;
      }

      // Report focus calls in other contexts (like ReturnStatement in IIFE)
      reportOnce(node, 'useWaitForFocus', function(fixer) {
        const focusCall = sourceCode.getText(node);

        // For IIFE or other complex cases
        if (statementNode.type === 'CallExpression') {
          // This is likely an IIFE like (() => { return element.focus(); })()
          // We want to replace the entire IIFE with the wrapped focus call
          const hasMultipleStatements = statementNode.parent && hasMultipleStatementsOnLine(statementNode.parent);

          if (hasMultipleStatements) {
            return fixer.replaceText(statementNode, `await act(async () => { ${focusCall} });`);
          } else {
            return fixer.replaceText(statementNode, `await act(async () => { ${focusCall} })`);
          }
        }

        // Default: no fix for complex cases that can't be auto-fixed
        return null;
      });
    }

    function checkFocusSelector(node) {
      // Check for :focus pseudo-selector
      if (!(node.type === 'Literal' && node.value === ':focus')) {
        return;
      }
      // Check if it's in querySelector, matches, etc.
      const parent = node.parent;
      if (!(parent && parent.type === 'CallExpression')) {
        return;
      }
      const callee = parent.callee;
      if (callee.type === 'MemberExpression' &&
          (callee.property.name === 'querySelector' ||
            callee.property.name === 'querySelectorAll' ||
            callee.property.name === 'matches' ||
            callee.property.name === 'locator')) {

        reportOnce(parent, 'avoidFocusCheck');
      }
    }

    function checkCypressCommands(node) {
      // Check for Cypress focused() command
      if (!(node.callee.type === 'MemberExpression')) {
        return;
      }
      const obj = node.callee.object;
      const prop = node.callee.property;

      if (obj && obj.name === 'cy' && prop && prop.name === 'focused') {
        reportOnce(node, 'avoidFocusCheck');
      }
    }

    function checkVariableDeclaration(node) {
      // Check for variable declarations that capture focus selectors
      if (!(node.init && node.init.type === 'CallExpression')) {
        return;
      }
      const callee = node.init.callee;
      if (!(callee.type === 'MemberExpression' && callee.property.name === 'querySelector')) {
        return;
      }
      
      const arg = node.init.arguments[0];
      if (arg && arg.type === 'Literal' && arg.value === ':focus') {
        reportOnce(node.init, 'avoidFocusCheck');
      }
    }

    function checkTabIndexAssertion(node) {
      // Check for tabIndex property assertions
      if (!(node.callee && node.callee.name === 'expect' && node.arguments.length > 0)) {
        return;
      }
      const arg = node.arguments[0];

      // Check for element.tabIndex
      if (arg.type === 'MemberExpression' && arg.property.name === 'tabIndex') {
        if (allowWithWaitFor && isInsideWaitFor(node)) {
          return;
        }

        reportOnce(node, 'avoidFocusCheck', createWaitForFix(node));
      }

      // Check for getAttribute('tabindex') or getAttribute('tabIndex')
      if (!(arg && arg.type === 'CallExpression' && arg.callee.type === 'MemberExpression' && arg.callee.property.name === 'getAttribute')) {
        return;
      }

      const attrArg = arg.arguments[0];
      if (attrArg && attrArg.type === 'Literal' && (attrArg.value === 'tabindex' || attrArg.value === 'tabIndex')) {
        if (allowWithWaitFor && isInsideWaitFor(node)) {
          return;
        }

        reportOnce(node, 'avoidFocusCheck', createWaitForFix(node));
      }
    }

    function checkAriaFocusAttributes(node) {
      // Check for ARIA focus-related attribute assertions
      if (node.callee && node.callee.name === 'expect' && node.arguments.length > 0) {
        const arg = node.arguments[0];

        // Check for hasAttribute('aria-focused') or hasAttribute('aria-activedescendant')
        if (arg && arg.type === 'CallExpression' &&
            arg.callee.type === 'MemberExpression' &&
            arg.callee.property.name === 'hasAttribute') {
          const attrArg = arg.arguments[0];
          if (attrArg && attrArg.type === 'Literal' &&
              (attrArg.value === 'aria-focused' ||
               attrArg.value === 'aria-activedescendant')) {
            if (allowWithWaitFor && isInsideWaitFor(node)) {
              return;
            }

            reportOnce(node, 'avoidFocusCheck', createWaitForFix(node));
          }
        }

        // Check for getAttribute('aria-focused') or getAttribute('aria-activedescendant')
        if (arg && arg.type === 'CallExpression' &&
            arg.callee.type === 'MemberExpression' &&
            arg.callee.property.name === 'getAttribute') {
          const attrArg = arg.arguments[0];
          if (attrArg && attrArg.type === 'Literal' &&
              (attrArg.value === 'aria-focused' ||
               attrArg.value === 'aria-activedescendant')) {
            if (allowWithWaitFor && isInsideWaitFor(node)) {
              return;
            }

            reportOnce(node, 'avoidFocusCheck', createWaitForFix(node));
          }
        }
      }
    }

    return {
      CallExpression(node) {
        checkFocusAssertion(node);
        checkFocusMethods(node);
        checkCypressCommands(node);
        checkTabIndexAssertion(node);
        checkAriaFocusAttributes(node);
      },
      MemberExpression(node) {
        checkActiveElement(node);
      },
      Literal(node) {
        checkFocusSelector(node);
      },
      VariableDeclarator(node) {
        checkVariableDeclaration(node);
      }
    };
  }
};