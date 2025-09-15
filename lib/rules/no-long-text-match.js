/**
 * @fileoverview Rule to prevent brittle long text content matching
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent brittle long text content matching that can break with minor changes',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-long-text-match.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          maxLength: {
            type: 'number',
            default: 100
          },
          ignoreComments: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      textTooLong: 'Text match of {{length}} characters is too long and brittle. Use partial matches or data-testid.',
      usePartialMatch: 'Use partial text matching or regex for long content.',
      useTestId: 'Consider using data-testid for element selection instead of text content.',
      avoidExactMatch: 'Exact matching of long dynamic content is fragile.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const maxLength = options.maxLength || 100;
    const ignoreComments = options.ignoreComments !== false;

    function checkTextContent(node, text) {
      if (typeof text !== 'string') return;
      
      // Ignore if it's in a comment
      if (ignoreComments) {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();
        for (const comment of comments) {
          if (comment.range[0] <= node.range[0] && node.range[1] <= comment.range[1]) {
            return;
          }
        }
      }
      
      // Check length
      if (text.length > maxLength) {
        // Check if it looks like dynamic content (has variables, dates, numbers)
        const isDynamic = /\d{4}|\$\{|\{\{/.test(text) || /\d+[.,]\d+/.test(text);
        
        context.report({
          node,
          messageId: isDynamic ? 'avoidExactMatch' : 'textTooLong',
          data: { length: text.length }
        });
      }
    }

    function checkTestingLibraryQueries(node) {
      // Check getByText, findByText, queryByText
      if (node.callee.type === 'Identifier' || 
          node.callee.type === 'MemberExpression') {
        
        const methodName = node.callee.name || 
                         (node.callee.property && node.callee.property.name);
        
        if (methodName && /^(get|find|query).*ByText$/.test(methodName)) {
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
            checkTextContent(arg, arg.value);
          }
        }
        
        // Check for screen.getByText patterns
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'screen' &&
            /ByText$/.test(node.callee.property.name)) {
          
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
            checkTextContent(arg, arg.value);
          }
        }
      }
    }

    function checkExpectTextContent(node) {
      // Check toHaveTextContent, toContainText, toBe with long strings
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        if (method === 'toHaveTextContent' || 
            method === 'toContainText' ||
            method === 'toHaveText') {
          
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
            checkTextContent(arg, arg.value);
          }
        }
        
        // Check toBe/toEqual with long strings
        if (method === 'toBe' || method === 'toEqual' || method === 'toMatch') {
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
            // Only check if it looks like text content (not IDs or short codes)
            if (arg.value.includes(' ') || arg.value.length > 50) {
              checkTextContent(arg, arg.value);
            }
          }
        }
      }
    }

    function checkTemplateLiterals(node) {
      // Check template literals that might contain long text
      if (node.type === 'TemplateLiteral') {
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText(node);
        
        // Remove backticks and variable substitutions for length check
        const cleanText = text.replace(/`/g, '').replace(/\$\{[^}]+\}/g, '...');
        
        if (cleanText.length > maxLength) {
          // Check if it's being used in a test assertion
          let parent = node.parent;
          while (parent) {
            if (parent.type === 'CallExpression' &&
                parent.callee.type === 'MemberExpression') {
              
              const method = parent.callee.property.name;
              if (/^to(Be|Equal|Match|Have|Contain)/.test(method)) {
                context.report({
                  node,
                  messageId: 'usePartialMatch',
                  data: { length: cleanText.length }
                });
                break;
              }
            }
            parent = parent.parent;
          }
        }
      }
    }

    function checkCypressCommands(node) {
      // Check Cypress contains() with long text
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'contains') {
        
        const arg = node.arguments[0];
        if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
          checkTextContent(arg, arg.value);
        }
      }
    }

    return {
      CallExpression(node) {
        checkTestingLibraryQueries(node);
        checkExpectTextContent(node);
        checkCypressCommands(node);
      },
      TemplateLiteral(node) {
        checkTemplateLiterals(node);
      }
    };
  }
};
