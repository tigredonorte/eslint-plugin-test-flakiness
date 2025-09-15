/**
 * @fileoverview Rule to avoid viewport-dependent assertions that may fail on different screen sizes
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid viewport-dependent assertions that may fail on different screen sizes',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-viewport-dependent.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowWithSetViewport: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidViewportCheck: 'Avoid viewport-dependent checks. Tests may fail on different screen sizes.',
      setFixedViewport: 'Set a fixed viewport size before viewport-dependent assertions.',
      avoidMediaQuery: 'Media query checks can fail on different screen sizes.',
      avoidPositionCheck: 'Position-based assertions are viewport-dependent.',
      avoidScrollCheck: 'Scroll-based checks depend on viewport size.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowWithSetViewport = options.allowWithSetViewport !== false;

    let hasSetViewport = false;

    function checkViewportQuery(node) {
      // Check for window.innerWidth/innerHeight
      if (node.type === 'MemberExpression') {
        if (node.object.name === 'window' &&
            (node.property.name === 'innerWidth' ||
             node.property.name === 'innerHeight' ||
             node.property.name === 'outerWidth' ||
             node.property.name === 'outerHeight')) {
          
          if (!allowWithSetViewport || !hasSetViewport) {
            context.report({
              node,
              messageId: 'avoidViewportCheck'
            });
          }
        }
        
        // Check for screen.width/height
        if (node.object.name === 'screen' &&
            (node.property.name === 'width' ||
             node.property.name === 'height' ||
             node.property.name === 'availWidth' ||
             node.property.name === 'availHeight')) {
          
          context.report({
            node,
            messageId: 'avoidViewportCheck'
          });
        }
        
        // Check for document.documentElement.clientWidth/Height
        if (node.object.type === 'MemberExpression' &&
            node.object.object.name === 'document' &&
            node.object.property.name === 'documentElement' &&
            (node.property.name === 'clientWidth' ||
             node.property.name === 'clientHeight')) {
          
          context.report({
            node,
            messageId: 'avoidViewportCheck'
          });
        }
      }
    }

    function checkMediaQuery(node) {
      // Check for window.matchMedia
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'window' &&
          node.callee.property.name === 'matchMedia') {
        
        context.report({
          node,
          messageId: 'avoidMediaQuery'
        });
      }
    }

    function checkBoundingRect(node) {
      // Check for getBoundingClientRect
      if (node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'getBoundingClientRect') {
        
        // Check if the result is being used for position assertions
        const parent = node.parent;
        if (parent && parent.type === 'MemberExpression') {
          const prop = parent.property.name;
          if (['top', 'left', 'right', 'bottom', 'x', 'y'].includes(prop)) {
            context.report({
              node: parent,
              messageId: 'avoidPositionCheck'
            });
          }
        }
      }
    }

    function checkScrollPosition(node) {
      // Check for scroll position checks
      if (node.type === 'MemberExpression') {
        const prop = node.property.name;
        
        // window.scrollY, window.pageYOffset, etc.
        if (node.object.name === 'window' &&
            ['scrollY', 'scrollX', 'pageYOffset', 'pageXOffset'].includes(prop)) {
          
          context.report({
            node,
            messageId: 'avoidScrollCheck'
          });
        }
        
        // element.scrollTop, element.scrollLeft
        if (['scrollTop', 'scrollLeft', 'scrollHeight', 'scrollWidth'].includes(prop)) {
          const sourceCode = context.getSourceCode();
          const objectText = sourceCode.getText(node.object);
          
          // Check if it looks like a DOM element
          if (!/mock|stub|spy/.test(objectText)) {
            context.report({
              node,
              messageId: 'avoidScrollCheck'
            });
          }
        }
      }
    }

    function checkViewportAssertion(node) {
      // Check for toBeInViewport, toBeVisible assertions that might be viewport-dependent
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        
        if (method === 'toBeInViewport' || 
            method === 'toBeInTheViewport' ||
            method === 'toBeFullyInViewport') {
          
          if (!allowWithSetViewport || !hasSetViewport) {
            context.report({
              node,
              messageId: 'avoidViewportCheck'
            });
          }
        }
      }
    }

    function checkViewportSetup(node) {
      // Check if viewport is being set
      if (node.callee.type === 'MemberExpression') {
        const method = node.callee.property.name;
        const obj = node.callee.object;
        
        // Playwright: page.setViewportSize
        if (method === 'setViewportSize' || method === 'setViewport') {
          hasSetViewport = true;
        }
        
        // Cypress: cy.viewport
        if (obj.name === 'cy' && method === 'viewport') {
          hasSetViewport = true;
        }
        
        // Puppeteer: page.setViewport
        if (method === 'setViewport') {
          hasSetViewport = true;
        }
      }
    }

    function checkResizeObserver(node) {
      // Check for ResizeObserver usage
      if (node.type === 'NewExpression' &&
          node.callee.name === 'ResizeObserver') {
        
        context.report({
          node,
          messageId: 'avoidViewportCheck'
        });
      }
    }

    function checkIntersectionObserver(node) {
      // Check for IntersectionObserver usage
      if (node.type === 'NewExpression' &&
          node.callee.name === 'IntersectionObserver') {
        
        if (!allowWithSetViewport || !hasSetViewport) {
          context.report({
            node,
            messageId: 'avoidViewportCheck'
          });
        }
      }
    }

    return {
      MemberExpression(node) {
        checkViewportQuery(node);
        checkScrollPosition(node);
      },
      CallExpression(node) {
        checkMediaQuery(node);
        checkBoundingRect(node);
        checkViewportAssertion(node);
        checkViewportSetup(node);
      },
      NewExpression(node) {
        checkResizeObserver(node);
        checkIntersectionObserver(node);
      },
      'Program:exit'() {
        // Reset for next file
        hasSetViewport = false;
      }
    };
  }
};
