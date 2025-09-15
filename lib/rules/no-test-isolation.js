/**
 * @fileoverview Rule to prevent .only in committed test files
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent .only in committed test files',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-test-only.md'
    },
    fixable: 'code',
    schema: [],
    messages: {
      noTestOnly: 'Remove .only from {{type}} before committing',
      noSkip: 'Remove .skip from {{type}} - skipped tests should be fixed or removed',
      noFocused: 'Remove focused test modifier ({{modifier}}) before committing'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    function checkOnly(node) {
      if (node.callee.type === 'MemberExpression') {
        const obj = node.callee.object;
        const prop = node.callee.property;
        
        // Check for test.only, it.only, describe.only
        const testFunctions = ['test', 'it', 'describe', 'context', 'suite'];
        
        if (obj.type === 'Identifier' && 
            testFunctions.includes(obj.name) && 
            prop.name === 'only') {
          
          context.report({
            node,
            messageId: 'noTestOnly',
            data: { type: obj.name },
            fix(fixer) {
              // Remove .only
              const sourceCode = context.getSourceCode();
              const dotToken = sourceCode.getTokenBefore(prop);
              const onlyToken = sourceCode.getTokenAfter(dotToken);
              
              return fixer.removeRange([
                dotToken.range[0],
                onlyToken.range[1]
              ]);
            }
          });
        }
      }
    }

    function checkSkip(node) {
      if (node.callee.type === 'MemberExpression') {
        const obj = node.callee.object;
        const prop = node.callee.property;
        
        // Check for test.skip, it.skip, describe.skip
        const testFunctions = ['test', 'it', 'describe', 'context', 'suite'];
        
        if (obj.type === 'Identifier' && 
            testFunctions.includes(obj.name) && 
            prop.name === 'skip') {
          
          context.report({
            node,
            messageId: 'noSkip',
            data: { type: obj.name },
            fix(fixer) {
              // Remove .skip
              const sourceCode = context.getSourceCode();
              const dotToken = sourceCode.getTokenBefore(prop);
              const skipToken = sourceCode.getTokenAfter(dotToken);
              
              return fixer.removeRange([
                dotToken.range[0],
                skipToken.range[1]
              ]);
            }
          });
        }
      }
    }

    function checkFocusedTests(node) {
      // Check for fdescribe, fit (Jasmine style)
      if (node.callee.type === 'Identifier') {
        const name = node.callee.name;
        
        if (name === 'fdescribe' || name === 'fit' || name === 'ftest') {
          context.report({
            node,
            messageId: 'noFocused',
            data: { modifier: name },
            fix(fixer) {
              // Remove the 'f' prefix
              return fixer.replaceText(
                node.callee,
                name.substring(1)
              );
            }
          });
        }
        
        // Check for xdescribe, xit (disabled tests)
        if (name === 'xdescribe' || name === 'xit' || name === 'xtest') {
          context.report({
            node,
            messageId: 'noSkip',
            data: { type: name.substring(1) },
            fix(fixer) {
              // Remove the 'x' prefix
              return fixer.replaceText(
                node.callee,
                name.substring(1)
              );
            }
          });
        }
      }
    }

    function checkJestEach(node) {
      // Check for test.only.each, it.only.each
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'each') {
        
        const obj = node.callee.object;
        if (obj.type === 'MemberExpression' &&
            obj.property.name === 'only') {
          
          const testObj = obj.object;
          if (testObj.type === 'Identifier' &&
              ['test', 'it', 'describe'].includes(testObj.name)) {
            
            context.report({
              node,
              messageId: 'noTestOnly',
              data: { type: `${testObj.name}.each` },
              fix(fixer) {
                // Replace test.only.each with test.each
                const sourceCode = context.getSourceCode();
                const testToken = sourceCode.getFirstToken(testObj);
                const eachToken = sourceCode.getLastToken(node.callee);
                
                return fixer.replaceTextRange(
                  [testToken.range[0], eachToken.range[1]],
                  `${testObj.name}.each`
                );
              }
            });
          }
        }
      }
    }

    function checkPlaywrightOnly(node) {
      // Check for Playwright's test.only patterns
      if (node.callee.type === 'CallExpression' &&
          node.callee.callee.type === 'MemberExpression') {
        
        const method = node.callee.callee.property.name;
        const obj = node.callee.callee.object;
        
        if (method === 'only' && obj.name === 'test') {
          context.report({
            node,
            messageId: 'noTestOnly',
            data: { type: 'test' },
            fix(fixer) {
              // Replace test.only(...) with test(...)
              return fixer.replaceText(
                node.callee.callee,
                'test'
              );
            }
          });
        }
      }
    }

    return {
      CallExpression(node) {
        checkOnly(node);
        checkSkip(node);
        checkFocusedTests(node);
        checkJestEach(node);
        checkPlaywrightOnly(node);
      }
    };
  }
};
