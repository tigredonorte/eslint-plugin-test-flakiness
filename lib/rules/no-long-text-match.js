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
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          maxLength: {
            type: 'number',
            default: 50
          },
          ignoreComments: {
            type: 'boolean',
            default: true
          },
          allowPartialMatch: {
            type: 'boolean',
            default: true
          },
          ignoreTestIds: {
            type: 'boolean',
            default: false
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      textTooLong: 'Text match of {{length}} characters is too long and brittle. Use partial matches or data-testid.',
      usePartialMatch: 'Use partial text matching or regex for long content.',
      useTestId: 'Consider using data-testid for element selection instead of text content.',
      avoidExactMatch: 'Exact matching of long dynamic content is fragile.',
      suggestExactFalse: 'Add { exact: false } option for partial matching.',
      suggestUseRegex: 'Convert to regex pattern for partial matching.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const maxLength = options.maxLength || 50;
    const ignoreComments = options.ignoreComments !== false;
    const allowPartialMatch = options.allowPartialMatch !== false;
    const ignoreTestIds = options.ignoreTestIds === true;

    // Helper function to clean template literals for length checking
    function cleanTemplateLiteral(text) {
      return text.replace(/`/g, '').replace(/\$\{[^}]+\}/g, 'X');
    }

    // Regex patterns for detecting dynamic content
    const DYNAMIC_PATTERNS = {
      LONG_NUMBER: /\d{9}/,           // Phone numbers, IDs, or long numeric sequences
      DATE_FORMAT: /\d{4}-\d{2}-\d{2}/, // ISO date format (YYYY-MM-DD)
      TEMPLATE_VAR: /\$\{|\{\{/,       // Template variables ${} or {{}}
      DECIMAL_NUMBERS: /\d+[.,]\d+[.,]\d+/ // Multiple decimal/comma separated numbers
    };

    function createTextSuggestions(callNode, textNode, text) {
      const suggestions = [];

      // Suggestion 1: Add { exact: false }
      if (callNode && callNode.arguments) {
        const hasSecondArg = callNode.arguments.length > 1;
        if (!hasSecondArg) {
          suggestions.push({
            messageId: 'suggestExactFalse',
            fix(fixer) {
              return fixer.insertTextAfter(textNode, ', { exact: false }');
            }
          });
        }
      }

      // Suggestion 2: Convert to regex
      if (textNode && textNode.type === 'Literal' && typeof textNode.value === 'string') {
        const words = text.split(/\s+/).filter(w => w.length > 3);
        if (words.length > 0) {
          const keyword = words[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          suggestions.push({
            messageId: 'suggestUseRegex',
            fix(fixer) {
              return fixer.replaceText(textNode, `/${keyword}/`);
            }
          });
        }
      }

      return suggestions.length > 0 ? suggestions : undefined;
    }

    function checkTextContent(node, text, suggestions) {
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
        // Check if it looks like dynamic content (has variables, dates, many numbers)
        const isDynamic = DYNAMIC_PATTERNS.LONG_NUMBER.test(text) ||
                         DYNAMIC_PATTERNS.DATE_FORMAT.test(text) ||
                         DYNAMIC_PATTERNS.TEMPLATE_VAR.test(text) ||
                         DYNAMIC_PATTERNS.DECIMAL_NUMBERS.test(text);

        const report = {
          node,
          messageId: isDynamic ? 'avoidExactMatch' : 'textTooLong',
          data: {
            length: text.length,
            maxLength: maxLength
          }
        };

        if (suggestions) {
          report.suggest = suggestions;
        }

        context.report(report);
      }
    }

    function checkTestingLibraryQueries(node) {
      // Check for ignoreTestIds - if the query is for a testId, skip it
      if (ignoreTestIds && node.callee.type === 'Identifier') {
        const methodName = node.callee.name;
        if (methodName && /^(get|find|query)(All)?ByTestId$/.test(methodName)) {
          return;
        }
      }

      // Check getByText, findByText, queryByText
      if (node.callee.type === 'Identifier') {
        const methodName = node.callee.name;

        if (methodName && /^(get|find|query)(All)?ByText$/.test(methodName)) {
          const arg = node.arguments[0];

          // Check for allowPartialMatch - skip if using regex or partial matching
          if (allowPartialMatch) {
            // Check if it's a regex literal
            if (arg && arg.type === 'Literal' && arg.regex) {
              return;
            }
            // Check if it's a regex created with RegExp constructor
            if (arg && arg.type === 'CallExpression' && arg.callee.name === 'RegExp') {
              return;
            }
            // Check for { exact: false } option
            const options = node.arguments[1];
            if (options && options.type === 'ObjectExpression') {
              const exactProp = options.properties.find(p => p.key && p.key.name === 'exact');
              if (exactProp && exactProp.value && exactProp.value.value === false) {
                return;
              }
            }
          }

          if (arg && arg.type === 'Literal') {
            if (typeof arg.value === 'string') {
              checkTextContent(arg, arg.value, createTextSuggestions(node, arg, arg.value));
            } else if (arg.regex) {
              // For regex literals, check the pattern length
              const patternLength = arg.regex.pattern.length;
              if (patternLength > maxLength) {
                checkTextContent(arg, arg.regex.pattern);
              }
            }
          } else if (arg && arg.type === 'TemplateLiteral') {
            // Handle template literals by getting their full text
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(arg);
            // Remove backticks and estimate final length
            const cleanText = cleanTemplateLiteral(text);
            if (cleanText.length > maxLength) {
              checkTextContent(arg, cleanText);
            }
          }
        }
      }

      // Check for screen.getByText patterns and other member expressions
      if (node.callee.type === 'MemberExpression') {
        const methodName = node.callee.property.name;

        // Check for ignoreTestIds with screen.getByTestId
        if (ignoreTestIds && node.callee.object && node.callee.object.name === 'screen' &&
            /^(get|find|query)(All)?ByTestId$/.test(methodName)) {
          return;
        }

        // Screen calls
        if (node.callee.object && node.callee.object.name === 'screen' &&
            /^(get|find|query)(All)?ByText$/.test(methodName)) {

          const arg = node.arguments[0];

          // Check for allowPartialMatch options
          if (allowPartialMatch) {
            // Check if it's a regex literal
            if (arg && arg.type === 'Literal' && arg.regex) {
              return;
            }
            // Check if it's a regex created with RegExp constructor
            if (arg && arg.type === 'CallExpression' && arg.callee.name === 'RegExp') {
              return;
            }
            // Check for { exact: false } option
            const options = node.arguments[1];
            if (options && options.type === 'ObjectExpression') {
              const exactProp = options.properties.find(p => p.key && p.key.name === 'exact');
              if (exactProp && exactProp.value && exactProp.value.value === false) {
                return;
              }
            }
          }

          if (arg && arg.type === 'Literal') {
            if (typeof arg.value === 'string') {
              checkTextContent(arg, arg.value, createTextSuggestions(node, arg, arg.value));
            } else if (arg.regex) {
              // For regex literals, check the pattern length
              const patternLength = arg.regex.pattern.length;
              if (patternLength > maxLength) {
                checkTextContent(arg, arg.regex.pattern);
              }
            }
          } else if (arg && arg.type === 'TemplateLiteral') {
            // Handle template literals by getting their full text
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(arg);
            // Remove backticks and estimate final length
            const cleanText = cleanTemplateLiteral(text);
            if (cleanText.length > maxLength) {
              checkTextContent(arg, cleanText);
            }
          }
        }

        // Check for ignoreTestIds with within().getByTestId
        if (ignoreTestIds && node.callee.object && node.callee.object.type === 'CallExpression' &&
            node.callee.object.callee && node.callee.object.callee.name === 'within' &&
            /^(get|find|query)(All)?ByTestId$/.test(methodName)) {
          return;
        }

        // within() calls
        if (node.callee.object && node.callee.object.type === 'CallExpression' &&
            node.callee.object.callee && node.callee.object.callee.name === 'within' &&
            /^(get|find|query)(All)?ByText$/.test(methodName)) {

          const arg = node.arguments[0];

          // Check for allowPartialMatch options
          if (allowPartialMatch) {
            // Check if it's a regex literal
            if (arg && arg.type === 'Literal' && arg.regex) {
              return;
            }
            // Check if it's a regex created with RegExp constructor
            if (arg && arg.type === 'CallExpression' && arg.callee.name === 'RegExp') {
              return;
            }
            // Check for { exact: false } option
            const options = node.arguments[1];
            if (options && options.type === 'ObjectExpression') {
              const exactProp = options.properties.find(p => p.key && p.key.name === 'exact');
              if (exactProp && exactProp.value && exactProp.value.value === false) {
                return;
              }
            }
          }

          if (arg && arg.type === 'Literal') {
            if (typeof arg.value === 'string') {
              checkTextContent(arg, arg.value, createTextSuggestions(node, arg, arg.value));
            } else if (arg.regex) {
              // For regex literals, check the pattern length
              const patternLength = arg.regex.pattern.length;
              if (patternLength > maxLength) {
                checkTextContent(arg, arg.regex.pattern);
              }
            }
          } else if (arg && arg.type === 'TemplateLiteral') {
            // Handle template literals by getting their full text
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(arg);
            // Remove backticks and estimate final length
            const cleanText = cleanTemplateLiteral(text);
            if (cleanText.length > maxLength) {
              checkTextContent(arg, cleanText);
            }
          }
        }

        // page.getByText (Playwright)
        if (node.callee.object && node.callee.object.name === 'page' &&
            methodName === 'getByText') {

          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
            checkTextContent(arg, arg.value);
          } else if (arg && arg.type === 'TemplateLiteral') {
            // Handle template literals by getting their full text
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(arg);
            // Remove backticks and estimate final length
            const cleanText = cleanTemplateLiteral(text);
            if (cleanText.length > maxLength) {
              checkTextContent(arg, cleanText);
            }
          }
        }

        // page.locator with text=
        if (node.callee.object && node.callee.object.name === 'page' &&
            methodName === 'locator') {

          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
            const selector = arg.value;
            if (selector.startsWith('text=')) {
              checkTextContent(arg, selector.substring(5)); // Remove 'text=' prefix
            }
          }
        }
      }
    }

    function checkExpectTextContent(node) {
      // Skip expect assertions - they are valid test patterns
      // The rule should focus on element selection, not assertion verification

      // However, if ignoreTestIds is true, we should skip assertions on elements selected by testId
      if (ignoreTestIds && node.callee.type === 'MemberExpression') {
        // Check if expect() is called on getByTestId result
        if (node.callee.object && node.callee.object.type === 'CallExpression') {
          const expectArg = node.callee.object.arguments[0];
          if (expectArg && expectArg.type === 'CallExpression') {
            const callee = expectArg.callee;
            if (callee.type === 'Identifier' && /^(get|find|query)(All)?ByTestId$/.test(callee.name)) {
              return;
            }
            if (callee.type === 'MemberExpression' && /^(get|find|query)(All)?ByTestId$/.test(callee.property.name)) {
              return;
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
        const cleanText = cleanTemplateLiteral(text);
        
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
                  data: {
                    length: cleanText.length,
                    maxLength: maxLength
                  }
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
