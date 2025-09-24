/**
 * @fileoverview Rule to prevent DOM queries by index
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent DOM queries by index which are fragile to structure changes',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-index-queries.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowNthChild: {
            type: 'boolean',
            default: false,
            description: 'Allow nth-child and positional CSS selectors'
          },
          allowSpecificIndices: {
            type: 'array',
            items: { type: 'integer' },
            default: [0, -1],
            description: 'Allow specific indices in query results (e.g., [0, -1] for first and last)'
          },
          ignoreDataTestId: {
            type: 'boolean',
            default: true,
            description: 'Ignore index access when queries use data-testid'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidIndexQuery: 'Avoid accessing query results by index [{{index}}]. Use more specific queries or getBy* methods.',
      avoidAtMethod: 'Avoid using .at() method on query results. Use more specific queries instead.',
      avoidNthChild: 'Avoid CSS selectors with positional queries. Use data-testid or accessible queries instead.',
      useSpecificQuery: 'Avoid using positional methods on query results. Use more specific queries instead.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    // Get configuration options with defaults
    const options = context.options?.[0] || {};
    const allowNthChild = options.allowNthChild || false;
    const allowSpecificIndices = options.allowSpecificIndices || [0, -1];
    const ignoreDataTestId = options.ignoreDataTestId !== false;

    function createAutoFixer(node, index) {
      if (index === '0' || index === 0) {
        // Try to convert queryAll/getAll[0] to query/get
        if (node.object && node.object.type === 'CallExpression') {
          const callee = node.object.callee;
          let methodName;

          if (callee.type === 'Identifier') {
            methodName = callee.name;
          } else if (callee.type === 'MemberExpression') {
            methodName = callee.property.name;
          }

          if (methodName) {
            const newMethodName = methodName
              .replace('queryAllBy', 'queryBy')
              .replace('getAllBy', 'getBy')
              .replace('findAllBy', 'findBy');

            if (newMethodName !== methodName) {
              return (fixer) => {
                const sourceCode = context.getSourceCode();
                const originalCall = sourceCode.getText(node.object);
                const newCall = originalCall.replace(methodName, newMethodName);
                return fixer.replaceText(node, newCall);
              };
            }
          }
        }
      }

      // Fallback: add comment
      return (fixer) => {
        const sourceCode = context.getSourceCode();
        const nodeText = sourceCode.getText(node);
        return fixer.replaceText(node, `${nodeText} /* Use a more specific query instead of index */`);
      };
    }

    function checkTestingLibraryQueries(node) {
      // Check for query[All|]By* with index access
      if (node.type === 'MemberExpression' &&
          node.computed &&
          node.property.type === 'Literal' &&
          typeof node.property.value === 'number') {

        // Check if this index is allowed by configuration
        const indexValue = node.property.value;
        if (allowSpecificIndices.includes(indexValue)) {
          return;
        }

        let objectToCheck = node.object;

        // Handle parenthesized expressions: (await findAllByText(...))[1]
        if (objectToCheck.type === 'AwaitExpression') {
          objectToCheck = objectToCheck.argument;
        }

        if (objectToCheck.type === 'CallExpression') {
          const callee = objectToCheck.callee;
          let isTestingLibraryQuery = false;

          // Check direct calls: queryAllByRole, getAllByText, etc.
          if (callee.type === 'Identifier' &&
              /^(query|get|find)(All)?By/.test(callee.name)) {
            isTestingLibraryQuery = true;
          }

          // Check screen.* calls
          if (callee.type === 'MemberExpression' &&
              callee.object && callee.object.name === 'screen' &&
              /^(query|get|find)(All)?By/.test(callee.property.name)) {
            isTestingLibraryQuery = true;
          }

          // Check within().* calls
          if (callee.type === 'MemberExpression' &&
              callee.object && callee.object.type === 'CallExpression' &&
              callee.object.callee && callee.object.callee.name === 'within' &&
              /^(query|get|find)(All)?By/.test(callee.property.name)) {
            isTestingLibraryQuery = true;
          }

          if (isTestingLibraryQuery) {
            // Check if using data-testid and ignoreDataTestId is true
            let isTestIdQuery = false;
            if (callee.type === 'Identifier') {
              isTestIdQuery = /ByTestId$/.test(callee.name);
            } else if (callee.type === 'MemberExpression' && callee.property) {
              isTestIdQuery = /ByTestId$/.test(callee.property.name);
            }

            if (ignoreDataTestId && isTestIdQuery) {
              return;
            }

            context.report({
              node,
              messageId: 'avoidIndexQuery',
              data: { index: String(node.property.value) },
              fix: createAutoFixer(node, node.property.value)
            });
          }
        }
      }

      // Also check variables that hold query results
      // e.g., const buttons = queryAllByRole('button'); buttons[0]
      if (node.type === 'MemberExpression' &&
          node.computed &&
          node.property.type === 'Literal' &&
          typeof node.property.value === 'number' &&
          node.object.type === 'Identifier') {

        // Check if this index is allowed by configuration
        const indexValue = node.property.value;
        if (allowSpecificIndices.includes(indexValue)) {
          return;
        }

        // This is a simple heuristic - check if the variable name suggests it's a query result
        const varName = node.object.name;
        if (/^(buttons|elements|nodes|queryResults|testResults)$/i.test(varName)) {
          context.report({
            node,
            messageId: 'avoidIndexQuery',
            data: { index: String(node.property.value) }
          });
        }
      }
    }

    function checkAtMethod(node) {
      // Check for .at() method
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'at') {

        // Check if it's called on a query result
        const object = node.callee.object;
        if (object.type === 'CallExpression') {
          const callee = object.callee;
          let isQueryResult = false;

          if (callee.type === 'Identifier' &&
              /^(query|get|find)(All)?By/.test(callee.name)) {
            isQueryResult = true;
          } else if (callee.type === 'MemberExpression' &&
                     /^(query|get|find)(All)?By/.test(callee.property.name)) {
            isQueryResult = true;
          }

          if (isQueryResult) {
            context.report({
              node,
              messageId: 'avoidAtMethod'
            });
          }
        }
      }
    }

    function checkPositionalMethods(node) {
      // Check for .first()/.last() on query results
      if (node.callee.type === 'MemberExpression' &&
          (node.callee.property.name === 'first' || node.callee.property.name === 'last')) {

        const object = node.callee.object;
        if (object.type === 'CallExpression') {
          const callee = object.callee;
          let isQueryResult = false;

          // Check for Testing Library queries
          if (callee.type === 'Identifier' &&
              /^(query|get|find)(All)?By/.test(callee.name)) {
            isQueryResult = true;
          } else if (callee.type === 'MemberExpression' &&
                     /^(query|get|find)(All)?By/.test(callee.property.name)) {
            isQueryResult = true;
          }

          // Check for Cypress get() calls
          if (callee.type === 'MemberExpression' &&
              callee.object && callee.object.name === 'cy' &&
              callee.property && callee.property.name === 'get') {
            isQueryResult = true;
          }

          // Check for Playwright locator calls
          const sourceCode = context.getSourceCode();
          const objectText = sourceCode.getText(object);
          if (/locator|page\.|frame\.|element/i.test(objectText)) {
            isQueryResult = true;
          }

          if (isQueryResult) {
            context.report({
              node,
              messageId: 'useSpecificQuery'
            });
          }
        }
      }
    }

    function checkCypressPlaywrightIndex(node) {
      // Check Cypress .eq() and Playwright .nth()
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;

        // Cypress .eq()
        if (method === 'eq' &&
            node.arguments[0] &&
            node.arguments[0].type === 'Literal' &&
            typeof node.arguments[0].value === 'number') {

          // Check if this index is allowed by configuration
          const indexValue = node.arguments[0].value;
          if (allowSpecificIndices.includes(indexValue)) {
            return;
          }

          context.report({
            node,
            messageId: 'avoidIndexQuery',
            data: { index: String(node.arguments[0].value) }
          });
        }

        // Playwright .nth()
        if (method === 'nth' &&
            node.arguments[0] &&
            node.arguments[0].type === 'Literal' &&
            typeof node.arguments[0].value === 'number') {

          // Check if this index is allowed by configuration
          const indexValue = node.arguments[0].value;
          if (allowSpecificIndices.includes(indexValue)) {
            return;
          }

          context.report({
            node,
            messageId: 'avoidIndexQuery',
            data: { index: String(node.arguments[0].value) }
          });
        }
      }
    }

    function checkSelectorString(node, selector) {
      if (typeof selector !== 'string') return;

      // Skip if allowNthChild is enabled
      if (allowNthChild) {
        return;
      }

      // Check for positional CSS selectors
      if (/:nth-child\(\d+\)|:nth-of-type\(\d+\)|:first-child|:last-child/.test(selector)) {
        // Check if using data-testid and ignoreDataTestId is true
        if (ignoreDataTestId && /data-testid/.test(selector)) {
          return;
        }

        context.report({
          node,
          messageId: 'avoidNthChild'
        });
      }
    }

    return {
      CallExpression(node) {
        checkAtMethod(node);
        checkPositionalMethods(node);
        checkCypressPlaywrightIndex(node);

        // Check querySelector calls
        if (node.callee.type === 'MemberExpression' &&
            (node.callee.property.name === 'querySelector' ||
             node.callee.property.name === 'querySelectorAll')) {
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal') {
            checkSelectorString(arg, arg.value);
          }
        }
      },

      MemberExpression(node) {
        checkTestingLibraryQueries(node);
      },

      TemplateLiteral(node) {
        const fullText = node.quasis.map(q => q.value.raw).join('');
        checkSelectorString(node, fullText);
      }
    };
  }
};