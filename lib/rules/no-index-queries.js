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
    fixable: null,
    schema: [],
    messages: {
      avoidNthChild: 'Avoid :nth-child({{index}}) selector. Use data-testid or accessible queries instead.',
      avoidIndexAccess: 'Avoid accessing elements by index [{{index}}]. Use data-testid or find specific element.',
      avoidFirstLast: 'Avoid :{{pseudo}} selector. Use more specific queries.',
      avoidArrayIndex: 'Avoid accessing query results by index. Use getBy* for single elements or more specific queries.',
      avoidDataIndex: 'Avoid data-index attributes. Use data-testid with meaningful names instead.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    function checkSelectorString(node, selector) {
      if (typeof selector !== 'string') return;
      
      // Check for :nth-child(n)
      const nthChildMatch = selector.match(/:nth-child\((\d+)\)/);
      if (nthChildMatch) {
        context.report({
          node,
          messageId: 'avoidNthChild',
          data: { index: nthChildMatch[1] }
        });
      }
      
      // Check for :first-child, :last-child
      const pseudoMatch = selector.match(/:(first|last)-child/);
      if (pseudoMatch) {
        context.report({
          node,
          messageId: 'avoidFirstLast',
          data: { pseudo: pseudoMatch[1] + '-child' }
        });
      }
      
      // Check for [data-index="n"]
      const dataIndexMatch = selector.match(/\[data-index=["'](\d+)["']\]/);
      if (dataIndexMatch) {
        context.report({
          node,
          messageId: 'avoidDataIndex'
        });
      }
    }

    function checkQuerySelector(node) {
      // Check querySelector/querySelectorAll calls
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        if (method === 'querySelector' || method === 'querySelectorAll') {
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal') {
            checkSelectorString(arg, arg.value);
          }
        }
      }
    }

    function checkGetElementsArrayAccess(node) {
      // Check for patterns like getElementsBy*()[n]
      if (node.type === 'MemberExpression' && 
          node.computed && 
          node.property.type === 'Literal' &&
          typeof node.property.value === 'number') {
        
        if (node.object.type === 'CallExpression') {
          const callee = node.object.callee;
          if (callee.type === 'MemberExpression') {
            const method = callee.property.name;
            
            // Check for getElementsBy* methods
            if (/^getElementsBy/.test(method)) {
              context.report({
                node,
                messageId: 'avoidIndexAccess',
                data: { index: node.property.value }
              });
            }
          }
        }
      }
    }

    function checkChildNodesAccess(node) {
      // Check for element.childNodes[n] or element.children[n]
      if (node.type === 'MemberExpression' && 
          node.computed && 
          node.property.type === 'Literal' &&
          typeof node.property.value === 'number') {
        
        if (node.object.type === 'MemberExpression') {
          const prop = node.object.property.name;
          if (prop === 'childNodes' || prop === 'children') {
            context.report({
              node,
              messageId: 'avoidIndexAccess',
              data: { index: node.property.value }
            });
          }
        }
      }
    }

    function checkTestingLibraryQueries(node) {
      // Check for getAllBy* queries with index access
      if (node.type === 'MemberExpression' && 
          node.computed && 
          node.property.type === 'Literal' &&
          typeof node.property.value === 'number') {
        
        if (node.object.type === 'CallExpression') {
          const callee = node.object.callee;
          
          // Check for getAllBy* patterns
          if (callee.type === 'Identifier' && /^getAllBy/.test(callee.name)) {
            context.report({
              node,
              messageId: 'avoidArrayIndex'
            });
          }
          
          // Check for screen.getAllBy* patterns
          if (callee.type === 'MemberExpression' &&
              callee.object.name === 'screen' &&
              /^getAllBy/.test(callee.property.name)) {
            context.report({
              node,
              messageId: 'avoidArrayIndex'
            });
          }
        }
      }
    }

    function checkJQueryCypress(node) {
      // Check for .eq(n), .get(n), :eq(n) in jQuery/Cypress
      if (node.callee && node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        // Check .eq(n) or .get(n)
        if ((method === 'eq' || method === 'get') && 
            node.arguments[0] &&
            node.arguments[0].type === 'Literal' &&
            typeof node.arguments[0].value === 'number') {
          
          context.report({
            node,
            messageId: 'avoidIndexAccess',
            data: { index: node.arguments[0].value }
          });
        }
        
        // Check for cy.get(':eq(n)')
        if (method === 'get' && 
            node.callee.object.name === 'cy' &&
            node.arguments[0] &&
            node.arguments[0].type === 'Literal') {
          
          const selector = node.arguments[0].value;
          if (typeof selector === 'string' && /:eq\(\d+\)/.test(selector)) {
            context.report({
              node: node.arguments[0],
              messageId: 'avoidIndexAccess',
              data: { index: selector.match(/:eq\((\d+)\)/)[1] }
            });
          }
        }
      }
    }

    function checkPlaywright(node) {
      // Check for nth() and first()/last() in Playwright
      if (node.callee && node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        // Check .nth(n)
        if (method === 'nth' && 
            node.arguments[0] &&
            node.arguments[0].type === 'Literal' &&
            typeof node.arguments[0].value === 'number') {
          
          context.report({
            node,
            messageId: 'avoidIndexAccess',
            data: { index: node.arguments[0].value }
          });
        }
        
        // Check .first() and .last()
        if (method === 'first' || method === 'last') {
          // Check if it's likely a Playwright locator
          const sourceCode = context.getSourceCode();
          const objectText = sourceCode.getText(node.callee.object);
          
          if (/locator|page\.|frame\.|element/i.test(objectText)) {
            context.report({
              node,
              messageId: 'avoidFirstLast',
              data: { pseudo: method }
            });
          }
        }
      }
    }

    return {
      CallExpression(node) {
        checkQuerySelector(node);
        checkJQueryCypress(node);
        checkPlaywright(node);
      },
      
      MemberExpression(node) {
        checkGetElementsArrayAccess(node);
        checkChildNodesAccess(node);
        checkTestingLibraryQueries(node);
      },
      
      // Check template literals with selectors
      TemplateLiteral(node) {
        const fullText = node.quasis.map(q => q.value.raw).join('');
        checkSelectorString(node, fullText);
      }
    };
  }
};