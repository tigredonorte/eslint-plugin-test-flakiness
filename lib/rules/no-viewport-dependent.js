/**
 * @fileoverview Rule to avoid viewport-dependent assertions that may fail on different screen sizes
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, getFilename } = require('../utils/helpers');

// Constants for allowed mock and DOM element names
const ALLOWED_MOCK_ELEMENT_NAMES = ['mock', 'stub', 'spy', 'element', 'container', 'node', 'target', 'div'];

// Maximum length for suffix in mock/element names to avoid false positives
const MAX_MOCK_NAME_SUFFIX_LENGTH = 10;

// Constants for viewport properties
const VIEWPORT_PROPERTIES = {
  window: ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight'],
  screen: ['width', 'height', 'availWidth', 'availHeight'],
  visualViewport: ['width', 'height'],
  documentElement: ['clientWidth', 'clientHeight'],
  body: ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight']
};

// Constants for scroll properties
const WINDOW_SCROLL_PROPERTIES = ['scrollY', 'scrollX', 'pageYOffset', 'pageXOffset'];
const ELEMENT_SCROLL_PROPERTIES = ['scrollTop', 'scrollLeft', 'scrollHeight', 'scrollWidth'];

// Pattern for detecting responsive test contexts in test descriptions
// Matches describe() or it() calls with strings containing responsive-related keywords
// Note: This is applied to the full file text, so it may match in comments
const RESPONSIVE_TEST_PATTERN = /(?:describe|it|test)\s*\(\s*['"`](?:[^'"`\\]|\\.)*\b(?:responsive|viewport|breakpoint|mobile|tablet|desktop|screen\s*sizes?|media\s*quer(?:y|ies))\b/i;

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
      avoidMediaQuery: 'Media query checks can fail on different screen sizes.',
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
      // For simple identifiers, check exact match or common patterns
      if (node.type === 'Identifier') {
        const name = node.name.toLowerCase();
        return ALLOWED_MOCK_ELEMENT_NAMES.some(allowed => {
          // Exact match
          if (name === allowed) return true;
          // Common patterns: mockElement, stubElement, etc.
          if (name === `${allowed}element` || name === `${allowed}object`) return true;
          // Check if it's a variable like mockDiv, stubContainer (limit suffix length to avoid false positives)
          return name.startsWith(allowed) && name.length <= allowed.length + MAX_MOCK_NAME_SUFFIX_LENGTH;
        });
      }

      // For member expressions, check the object name
      if (node.type === 'MemberExpression' && node.object.type === 'Identifier') {
        const objName = node.object.name.toLowerCase();
        return ALLOWED_MOCK_ELEMENT_NAMES.some(allowed => {
          if (objName === allowed) return true;
          if (objName === `${allowed}element` || objName === `${allowed}object`) return true;
          return objName.startsWith(allowed) && objName.length <= allowed.length + MAX_MOCK_NAME_SUFFIX_LENGTH;
        });
      }

      return false;
    }

    function isViewportProperty(node) {
      if (node.type !== 'MemberExpression') return false;

      // window.innerWidth, window.innerHeight, etc.
      if (node.object.name === 'window' &&
          VIEWPORT_PROPERTIES.window.includes(node.property.name)) {
        return { type: 'viewport', property: `window.${node.property.name}` };
      }

      // screen.width, screen.height, etc.
      if (node.object.name === 'screen' &&
          VIEWPORT_PROPERTIES.screen.includes(node.property.name)) {
        return { type: 'screen', property: `screen.${node.property.name}` };
      }

      // visualViewport.width, visualViewport.height
      if (node.object.name === 'visualViewport' &&
          VIEWPORT_PROPERTIES.visualViewport.includes(node.property.name)) {
        return { type: 'viewport', property: `visualViewport.${node.property.name}` };
      }

      // document.documentElement.clientWidth, etc.
      if (node.object.type === 'MemberExpression' &&
          node.object.object.name === 'document' &&
          node.object.property.name === 'documentElement' &&
          VIEWPORT_PROPERTIES.documentElement.includes(node.property.name)) {
        return { type: 'viewport', property: `document.documentElement.${node.property.name}` };
      }

      // document.body.clientWidth, etc.
      if (node.object.type === 'MemberExpression' &&
          node.object.object.name === 'document' &&
          node.object.property.name === 'body' &&
          VIEWPORT_PROPERTIES.body.includes(node.property.name)) {
        return { type: 'viewport', property: `document.body.${node.property.name}` };
      }

      return false;
    }

    function isScrollProperty(node) {
      if (node.type !== 'MemberExpression') return false;

      // window.scrollY, window.pageYOffset, etc.
      if (node.object.name === 'window' &&
          WINDOW_SCROLL_PROPERTIES.includes(node.property.name)) {
        return true;
      }

      // Not a scroll property at all
      if (!ELEMENT_SCROLL_PROPERTIES.includes(node.property.name)) {
        return false;
      }

      // Element scroll property - skip if it's a mock object or known DOM element
      if (isMockOrElementObject(node.object)) {
        return false;
      }

      // Report scroll properties on non-mock objects
      return true;
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

    // Helper function to report viewport property issues
    function reportViewportPropertyIssue(node, viewportInfo) {
      if (isResponsiveTest) return;

      if (viewportInfo.type === 'screen') {
        reportOnce(node, 'avoidScreenCheck', { property: viewportInfo.property });
        return;
      }

      reportOnce(node, 'avoidViewportCheck', { property: viewportInfo.property });
    }

    // Helper function to check if node is handled by another visitor
    function isHandledByOtherVisitor(node) {
      let parent = node.parent;

      // Check if it's in a binary expression - let BinaryExpression handle it
      if (parent && parent.type === 'BinaryExpression') {
        return true;
      }

      // Check if it's in a variable declaration - let VariableDeclarator handle it
      while (parent && parent.type !== 'Program') {
        if (parent.type === 'VariableDeclarator' && parent.init === node) {
          return true;
        }
        parent = parent.parent;
      }

      return false;
    }

    // Helper function to check if node is in a read-only context
    function isInReadOnlyContext(node) {
      let currentParent = node.parent;

      // Check if it's in console.log() or similar logging
      if (currentParent && currentParent.type === 'CallExpression' &&
          currentParent.callee.type === 'MemberExpression' &&
          currentParent.callee.object.name === 'console') {
        return true;
      }

      // Check if it's just a property in an object literal (debug info)
      if (currentParent && currentParent.type === 'Property' &&
          currentParent.parent && currentParent.parent.type === 'ObjectExpression') {
        return true;
      }

      // Check if it's inside a resize event handler
      let checkNode = currentParent;
      while (checkNode) {
        if (checkNode.type === 'AssignmentExpression' &&
            checkNode.left.type === 'MemberExpression' &&
            checkNode.left.object.name === 'window' &&
            checkNode.left.property.name === 'onresize') {
          return true;
        }
        // Also check for addEventListener('resize', ...)
        if (checkNode.type === 'CallExpression' &&
            checkNode.callee.type === 'MemberExpression' &&
            checkNode.callee.property.name === 'addEventListener' &&
            checkNode.arguments.length > 0 &&
            checkNode.arguments[0].type === 'Literal' &&
            checkNode.arguments[0].value === 'resize') {
          return true;
        }
        checkNode = checkNode.parent;
      }

      return false;
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
          // Skip if handled by another visitor
          if (isHandledByOtherVisitor(node)) return;

          // Skip if in read-only context
          if (isInReadOnlyContext(node)) return;

          // Report issue if not in responsive test and viewport not set
          if (!isResponsiveTest && (!allowViewportSetup || !hasSetViewport)) {
            reportViewportPropertyIssue(node, viewportInfo);
          }
          return;
        }

        // Handle scroll properties (filtering is done inside isScrollProperty)
        if (!isScrollProperty(node)) return;
        if (isResponsiveTest) return;

        reportOnce(node, 'avoidScrollCheck');
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

        // Only process MemberExpression callees
        if (callee.type !== 'MemberExpression') return;

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
          // Check AST structure directly for document.documentElement or document.body
          const obj = callee.object;
          const isViewportElement = obj.type === 'MemberExpression' &&
                                   obj.object.name === 'document' &&
                                   (obj.property.name === 'documentElement' || obj.property.name === 'body');

          if (isResponsiveTest || !isViewportElement) return;

          reportOnce(node, 'avoidBoundingRect');
          return;
        }

        // addEventListener for resize
        if (method !== 'addEventListener') return;
        if (node.arguments.length === 0) return;
        if (node.arguments[0].type !== 'Literal') return;
        if (node.arguments[0].value !== 'resize') return;
        if (isResponsiveTest) return;

        reportOnce(node, 'avoidResizeListener');
      },

      // Handle new expressions
      NewExpression(node) {
        if (node.callee.name === 'ResizeObserver') {
          if (isResponsiveTest) return;
          reportOnce(node, 'avoidViewportCheck', { property: 'ResizeObserver' });
          return;
        }

        if (node.callee.name === 'IntersectionObserver') {
          if (isResponsiveTest) return;
          if (allowViewportSetup && hasSetViewport) return;
          reportOnce(node, 'avoidViewportCheck', { property: 'viewport-IntersectionObserver' });
        }
      },

      // Handle assignment expressions (window.onresize = ...)
      AssignmentExpression(node) {
        if (node.left.type !== 'MemberExpression') return;
        if (node.left.object.name !== 'window') return;
        if (node.left.property.name !== 'onresize') return;
        if (isResponsiveTest) return;

        reportOnce(node, 'avoidResizeListener');
      },

      // Handle binary expressions for responsive breakpoint checks
      BinaryExpression(node) {
        const left = node.left;
        const right = node.right;

        // Check both sides for viewport properties
        const leftInfo = isViewportProperty(left);
        const rightInfo = isViewportProperty(right);

        // Early return if no viewport properties
        if (!leftInfo && !rightInfo) return;

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

        // Report issues based on context
        if (isInVariableDeclaration) {
          // In variable declarations, report useFixedViewport for any viewport property
          if (leftInfo && !isResponsiveTest) {
            reportOnce(left, 'useFixedViewport');
          }
          if (rightInfo && !isResponsiveTest) {
            reportOnce(right, 'useFixedViewport');
          }
          return;
        }

        // In other contexts (like if statements), use the standard reporting
        if (leftInfo) {
          reportViewportPropertyIssue(left, leftInfo);
        }
        if (rightInfo) {
          reportViewportPropertyIssue(right, rightInfo);
        }
      },

      // Handle variable declarations
      VariableDeclarator(node) {
        if (!node.init) return;

        const viewportInfo = isViewportProperty(node.init);
        if (!viewportInfo) return;

        reportViewportPropertyIssue(node.init, viewportInfo);
      },

      // Handle property access in variable patterns (destructuring)
      Property(node) {
        // Only handle if this is part of a destructuring pattern
        if (!node.parent || node.parent.type !== 'ObjectPattern') return;

        // Check if the value being destructured is a viewport property
        let declarator = node.parent.parent;
        if (!declarator || declarator.type !== 'VariableDeclarator') return;
        if (!declarator.init) return;

        // Check AST structure directly
        const init = declarator.init;

        // Only handle simple identifiers (window, screen)
        if (init.type !== 'Identifier') return;

        // Configuration for destructuring sources
        const destructuringSources = [
          { source: 'window', type: 'viewport', properties: VIEWPORT_PROPERTIES.window },
          { source: 'screen', type: 'screen', properties: VIEWPORT_PROPERTIES.screen }
        ];

        // Check each configured source
        for (const config of destructuringSources) {
          if (init.name === config.source && config.properties.includes(node.key.name)) {
            const property = `${config.source}.${node.key.name}`;
            const viewportInfo = { type: config.type, property };
            reportViewportPropertyIssue(node, viewportInfo);
            break;
          }
        }
      }
    };
  }
};