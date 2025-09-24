/**
 * @fileoverview Rule to avoid viewport-dependent assertions that may fail on different screen sizes
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, getFilename } = require('../utils/helpers');

// Constants for allowed mock and DOM element names
const ALLOWED_MOCK_ELEMENT_NAMES = ['mock', 'stub', 'spy', 'element', 'container', 'node', 'target', 'div'];

// Pattern for detecting responsive test contexts
const RESPONSIVE_TEST_PATTERN = /describe.*['"`](?:.*responsive|viewport|breakpoint|mobile|tablet|desktop|screen\s*size|media\s*query)/i;

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
          allowViewportSetup: {
            type: 'boolean',
            default: true,
            description: 'Allow viewport configuration in test setup hooks'
          },
          allowResponsiveTests: {
            type: 'boolean',
            default: false,
            description: 'Allow tests specifically designed for responsive design testing'
          },
          ignoreMediaQueries: {
            type: 'boolean',
            default: false,
            description: 'Ignore tests that specifically test CSS media query behavior'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidViewportCheck: 'Avoid viewport-dependent checks. Tests may fail on different screen sizes. Property: {{property}}',
      avoidScreenCheck: 'Screen dimension checks can fail on different screen sizes. Property: {{property}}',
      avoidBoundingRect: 'getBoundingClientRect checks are viewport-dependent',
      useFixedViewport: 'Set a fixed viewport size before viewport-dependent assertions',
      avoidResizeListener: 'Resize event listeners are viewport-dependent',
      setFixedViewport: 'Set a fixed viewport size before viewport-dependent assertions.',
      avoidMediaQuery: 'Media query checks can fail on different screen sizes.',
      avoidPositionCheck: 'Position-based assertions are viewport-dependent.',
      avoidScrollCheck: 'Scroll-based checks depend on viewport size.'
    }
  },

  create(context) {
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
      return {};
    }

    const options = context.options[0] || {};
    const allowViewportSetup = options.allowViewportSetup !== false;
    const allowResponsiveTests = options.allowResponsiveTests || false;
    const ignoreMediaQueries = options.ignoreMediaQueries || false;

    // State variables - initialized in Program handler to prevent leakage between files
    let hasSetViewport;
    let reportedNodes;
    let isResponsiveTest;

    // Helper function to check if a node is a function node
    function isFunctionNode(node) {
      return node.type === 'FunctionDeclaration' ||
             node.type === 'FunctionExpression' ||
             node.type === 'ArrowFunctionExpression';
    }

    // Helper function to consistently check for mock objects and DOM elements
    function isMockOrElementObject(node) {
      // For simple identifiers, check exact match or starts with allowed name
      if (node.type === 'Identifier') {
        const name = node.name.toLowerCase();
        return ALLOWED_MOCK_ELEMENT_NAMES.some(allowed =>
          name === allowed || name.startsWith(allowed)
        );
      }

      // For member expressions, check the object name
      if (node.type === 'MemberExpression' && node.object.type === 'Identifier') {
        const objName = node.object.name.toLowerCase();
        return ALLOWED_MOCK_ELEMENT_NAMES.some(allowed =>
          objName === allowed || objName.startsWith(allowed)
        );
      }

      return false;
    }

    function isViewportProperty(node) {
      if (node.type !== 'MemberExpression') return false;

      // window.innerWidth, window.innerHeight, etc.
      if (node.object.name === 'window' &&
          ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight'].includes(node.property.name)) {
        return { type: 'viewport', property: `window.${node.property.name}` };
      }

      // screen.width, screen.height, etc.
      if (node.object.name === 'screen' &&
          ['width', 'height', 'availWidth', 'availHeight'].includes(node.property.name)) {
        return { type: 'screen', property: `screen.${node.property.name}` };
      }

      // visualViewport.width, visualViewport.height
      if (node.object.name === 'visualViewport' &&
          ['width', 'height'].includes(node.property.name)) {
        return { type: 'viewport', property: `visualViewport.${node.property.name}` };
      }

      // document.documentElement.clientWidth, etc.
      if (node.object.type === 'MemberExpression' &&
          node.object.object.name === 'document' &&
          node.object.property.name === 'documentElement' &&
          ['clientWidth', 'clientHeight'].includes(node.property.name)) {
        return { type: 'viewport', property: `document.documentElement.${node.property.name}` };
      }

      // document.body.clientWidth, etc.
      if (node.object.type === 'MemberExpression' &&
          node.object.object.name === 'document' &&
          node.object.property.name === 'body' &&
          ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight'].includes(node.property.name)) {
        return { type: 'viewport', property: `document.body.${node.property.name}` };
      }

      return false;
    }

    function isScrollProperty(node) {
      if (node.type !== 'MemberExpression') return false;

      // window.scrollY, window.pageYOffset, etc.
      if (node.object.name === 'window' &&
          ['scrollY', 'scrollX', 'pageYOffset', 'pageXOffset'].includes(node.property.name)) {
        return true;
      }

      // Generic scroll properties
      if (['scrollTop', 'scrollLeft', 'scrollHeight', 'scrollWidth'].includes(node.property.name)) {
        // Returns true for any element with scroll properties.
        // The caller is responsible for context-specific filtering (e.g., mock objects vs. real DOM elements).
        return true;
      }

      return false;
    }

    function reportOnce(node, messageId, data) {
      const nodeKey = `${node.range[0]}-${node.range[1]}`;
      if (!reportedNodes.has(nodeKey)) {
        reportedNodes.add(nodeKey);
        context.report({
          node,
          messageId,
          data
        });
      }
    }

    return {
      // Initialize state and check for responsive test context at the start
      Program(_node) {
        // Initialize state variables for this file to prevent leakage between files
        hasSetViewport = false;
        reportedNodes = new Set();
        isResponsiveTest = false;

        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();
        // Check if file has responsive test indicators
        if (allowResponsiveTests) {
          isResponsiveTest = RESPONSIVE_TEST_PATTERN.test(text);
        }
      },

      // Handle member expressions (property access)
      MemberExpression(node) {
        const viewportInfo = isViewportProperty(node);
        if (viewportInfo) {
          // Check if this node is already handled by other visitors
          let parent = node.parent;
          let isHandledByOtherVisitor = false;

          // Check if it's in a binary expression - let BinaryExpression handle it
          if (parent && parent.type === 'BinaryExpression') {
            isHandledByOtherVisitor = true;
          }

          // Check if it's in a variable declaration - let VariableDeclarator handle it
          while (parent && parent.type !== 'Program') {
            if (parent.type === 'VariableDeclarator' && parent.init === node) {
              isHandledByOtherVisitor = true;
              break;
            }
            parent = parent.parent;
          }

          if (isHandledByOtherVisitor) {
            return; // Let other visitor handle this
          }

          // Check for read-only contexts
          let currentParent = node.parent;
          let isReadOnly = false;

          // Check if it's in console.log() or similar logging
          if (currentParent && currentParent.type === 'CallExpression' &&
              currentParent.callee.type === 'MemberExpression' &&
              currentParent.callee.object.name === 'console') {
            isReadOnly = true;
          }

          // Check if it's just a property in an object literal (debug info)
          if (currentParent && currentParent.type === 'Property' &&
              currentParent.parent && currentParent.parent.type === 'ObjectExpression') {
            isReadOnly = true;
          }

          // Check if it's inside a resize event handler (don't double report)
          let checkNode = currentParent;
          while (checkNode) {
            if (checkNode.type === 'AssignmentExpression' &&
                checkNode.left.type === 'MemberExpression' &&
                checkNode.left.object.name === 'window' &&
                checkNode.left.property.name === 'onresize') {
              isReadOnly = true;
              break;
            }
            // Also check for addEventListener('resize', ...)
            if (checkNode.type === 'CallExpression' &&
                checkNode.callee.type === 'MemberExpression' &&
                checkNode.callee.property.name === 'addEventListener' &&
                checkNode.arguments.length > 0 &&
                checkNode.arguments[0].type === 'Literal' &&
                checkNode.arguments[0].value === 'resize') {
              isReadOnly = true;
              break;
            }
            checkNode = checkNode.parent;
          }

          if (!isReadOnly && !isResponsiveTest && (!allowViewportSetup || !hasSetViewport)) {
            if (viewportInfo.type === 'screen') {
              reportOnce(node, 'avoidScreenCheck', { property: viewportInfo.property });
            } else {
              reportOnce(node, 'avoidViewportCheck', { property: viewportInfo.property });
            }
          }
        }

        // Handle scroll properties but avoid flagging element properties
        if (isScrollProperty(node)) {
          // Check if it's a mock object or DOM element
          const isMockOrElement = isMockOrElementObject(node.object);

          // Only flag if it doesn't look like a specific element property
          // Allow: div.scrollWidth, element.scrollTop, container.scrollLeft, etc.
          if (!isResponsiveTest && !isMockOrElement) {
            reportOnce(node, 'avoidScrollCheck');
          }
        }
      },

      // Handle function calls
      CallExpression(node) {
        const callee = node.callee;

        // Check for global matchMedia (without window prefix)
        if (callee.type === 'Identifier' && callee.name === 'matchMedia') {
          if (!ignoreMediaQueries && !isResponsiveTest) {
            reportOnce(node, 'avoidViewportCheck', { property: 'matchMedia' });
          }
          return;
        }

        // Check viewport setup calls
        if (callee.type === 'MemberExpression') {
          const method = callee.property.name;

          // Playwright: page.setViewportSize
          if (method === 'setViewportSize' || method === 'setViewport') {
            hasSetViewport = true;
            return;
          }

          // Cypress: cy.viewport
          if (callee.object.name === 'cy' && method === 'viewport') {
            hasSetViewport = true;
            return;
          }

          // window.matchMedia
          if (callee.object.name === 'window' && method === 'matchMedia') {
            if (!ignoreMediaQueries && !isResponsiveTest) {
              reportOnce(node, 'avoidViewportCheck', { property: 'window.matchMedia' });
            }
            return;
          }

          // getBoundingClientRect on viewport elements
          if (method === 'getBoundingClientRect') {
            const objText = context.getSourceCode().getText(callee.object);
            if (!isResponsiveTest && (objText.includes('document.documentElement') || objText.includes('document.body'))) {
              reportOnce(node, 'avoidBoundingRect');
            }
          }

          // addEventListener for resize
          if (method === 'addEventListener' &&
              node.arguments.length > 0 &&
              node.arguments[0].type === 'Literal' &&
              node.arguments[0].value === 'resize') {
            if (!isResponsiveTest) {
              reportOnce(node, 'avoidResizeListener');
            }
          }
        }
      },

      // Handle new expressions
      NewExpression(node) {
        if (node.callee.name === 'ResizeObserver') {
          if (!isResponsiveTest) {
            reportOnce(node, 'avoidViewportCheck', { property: 'ResizeObserver' });
          }
        }

        if (node.callee.name === 'IntersectionObserver') {
          if (!isResponsiveTest && (!allowViewportSetup || !hasSetViewport)) {
            reportOnce(node, 'avoidViewportCheck', { property: 'viewport-IntersectionObserver' });
          }
        }
      },

      // Handle assignment expressions (window.onresize = ...)
      AssignmentExpression(node) {
        if (node.left.type === 'MemberExpression' &&
            node.left.object.name === 'window' &&
            node.left.property.name === 'onresize') {
          if (!isResponsiveTest) {
            reportOnce(node, 'avoidResizeListener');
          }
        }
      },

      // Handle binary expressions for responsive breakpoint checks
      BinaryExpression(node) {
        const left = node.left;
        const right = node.right;

        // Check if we're in a variable declaration context (which expects useFixedViewport)
        let isInVariableDeclaration = false;
        let parent = node.parent;
        while (parent) {
          if (parent.type === 'VariableDeclarator') {
            isInVariableDeclaration = true;
            break;
          }
          if (isFunctionNode(parent)) {
            break;
          }
          parent = parent.parent;
        }

        if (isInVariableDeclaration) {
          // In variable declarations, report useFixedViewport for any viewport property
          const leftInfo = isViewportProperty(left);
          const rightInfo = isViewportProperty(right);

          if (leftInfo && !isResponsiveTest) {
            reportOnce(left, 'useFixedViewport');
          }
          if (rightInfo && !isResponsiveTest) {
            reportOnce(right, 'useFixedViewport');
          }
        } else {
          // In other contexts (like if statements), report appropriate message
          const leftInfo = isViewportProperty(left);
          const rightInfo = isViewportProperty(right);

          if (leftInfo && !isResponsiveTest) {
            if (leftInfo.type === 'screen') {
              reportOnce(left, 'avoidScreenCheck', { property: leftInfo.property });
            } else {
              reportOnce(left, 'avoidViewportCheck', { property: leftInfo.property });
            }
          }
          if (rightInfo && !isResponsiveTest) {
            if (rightInfo.type === 'screen') {
              reportOnce(right, 'avoidScreenCheck', { property: rightInfo.property });
            } else {
              reportOnce(right, 'avoidViewportCheck', { property: rightInfo.property });
            }
          }
        }
      },

      // Handle variable declarations
      VariableDeclarator(node) {
        if (node.init) {
          const viewportInfo = isViewportProperty(node.init);
          if (viewportInfo && !isResponsiveTest) {
            if (viewportInfo.type === 'screen') {
              reportOnce(node.init, 'avoidScreenCheck', { property: viewportInfo.property });
            } else {
              reportOnce(node.init, 'avoidViewportCheck', { property: viewportInfo.property });
            }
          }
        }
      },

      // Handle property access in variable patterns (destructuring)
      Property(node) {
        // Only handle if this is part of a destructuring pattern
        if (node.parent && node.parent.type === 'ObjectPattern') {
          // Check if the value being destructured is a viewport property
          let declarator = node.parent.parent;
          if (declarator && declarator.type === 'VariableDeclarator' && declarator.init) {
            // Check if we're destructuring from window, screen, etc.
            const sourceCode = context.getSourceCode();
            const initText = sourceCode.getText(declarator.init);

            if (initText === 'window' &&
                ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight'].includes(node.key.name)) {
              const property = `window.${node.key.name}`;
              if (!isResponsiveTest) {
                reportOnce(node, 'avoidViewportCheck', { property });
              }
            }

            if (initText === 'screen' &&
                ['width', 'height', 'availWidth', 'availHeight'].includes(node.key.name)) {
              const property = `screen.${node.key.name}`;
              if (!isResponsiveTest) {
                reportOnce(node, 'avoidScreenCheck', { property });
              }
            }
          }
        }
      }
    };
  }
};