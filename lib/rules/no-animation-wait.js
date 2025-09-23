/**
 * @fileoverview Rule to avoid waiting for animations in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, getFilename } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid waiting for animations which can have variable timing',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-animation-wait.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowAnimationFrame: {
            type: 'boolean',
            default: false,
            description: 'Allow requestAnimationFrame waits'
          },
          allowIfAnimationsDisabled: {
            type: 'boolean',
            default: true,
            description: 'Allow animation waits if animations appear to be disabled in test setup'
          },
          customAnimationPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Additional patterns to detect as animation waits'
          },
          ignorePatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Patterns to ignore even if they match animation waits'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidAnimationWait: 'Avoid waiting for animations. Disable animations in tests or use stable conditions.',
      avoidTransitionWait: 'Avoid waiting for CSS transitions. Disable transitions in tests or use stable conditions.',
      avoidAnimationFrame: 'Avoid waiting for animation frames. Consider using stable conditions instead.'
    }
  },

  create(context) {
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
      return {};
    }

    const options = context.options ? (context.options[0] || {}) : {};
    const allowAnimationFrame = options.allowAnimationFrame || false;
    const allowIfAnimationsDisabled = options.allowIfAnimationsDisabled !== false;
    const customAnimationPatterns = options.customAnimationPatterns || [];
    const ignorePatterns = options.ignorePatterns || [];

    let animationsDisabled = false;
    let sourceCode = null;

    // Check if animations are disabled in the test file
    function checkAnimationsDisabled() {
      if (!sourceCode) {
        sourceCode = context.getSourceCode();
      }

      const text = sourceCode.getText();

      // Check for common patterns that disable animations
      const disablePatterns = [
        // CSS that disables animations
        /animation-duration:\s*0/i,
        /transition-duration:\s*0/i,
        /animation:\s*none/i,
        /transition:\s*none/i,
        // Test utilities that disable animations
        /disableAnimations/i,
        /skipAnimations/i,
        /instantAnimations/i,
        /DISABLE_ANIMATIONS/,
        // Common test setup patterns
        /prefersReducedMotion.*true/,
        /matchMedia.*prefers-reduced-motion.*reduce/
      ];

      return disablePatterns.some(pattern => pattern.test(text));
    }

    return {
      Program() {
        if (allowIfAnimationsDisabled) {
          animationsDisabled = checkAnimationsDisabled();
        }
      },

      CallExpression(node) {
        // Skip if animations are disabled and we allow waits in that case
        if (allowIfAnimationsDisabled && animationsDisabled) {
          return;
        }

        // Check against ignore patterns
        if (ignorePatterns.length > 0) {
          const nodeText = context.getSourceCode().getText(node);
          if (ignorePatterns.some(pattern => {
            const regex = new RegExp(pattern);
            return regex.test(nodeText);
          })) {
            return;
          }
        }

        // Check for animation wait function patterns
        const animationFunctions = [
          'waitForAnimation',
          'waitForAnimations',
          'waitForTransition',
          'waitForTransitions',
          'waitForCSSAnimation',
          'waitForCSSTransition',
          ...customAnimationPatterns
        ];

        if (node.callee.name && animationFunctions.includes(node.callee.name)) {
          context.report({
            node,
            messageId: 'avoidAnimationWait'
          });
          return;
        }

        // Check for requestAnimationFrame patterns
        if (!allowAnimationFrame) {
          if (node.callee.name === 'requestAnimationFrame' ||
              (node.callee.type === 'MemberExpression' &&
               node.callee.property.name === 'requestAnimationFrame')) {
            context.report({
              node,
              messageId: 'avoidAnimationFrame'
            });
            return;
          }
        }

        // Check for waitFor with animation/transition events
        if (node.callee.type === 'MemberExpression' &&
            node.callee.property.name === 'waitFor') {
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
            // Extended list of animation/transition events
            const animationEvents = [
              'transitionend',
              'animationend',
              'transitionstart',
              'animationstart',
              'transitioncancel',
              'animationcancel',
              'transitionrun',
              'animationiteration',
              // Vendor-prefixed events
              'webkitTransitionEnd',
              'webkitAnimationEnd',
              'oTransitionEnd',
              'oAnimationEnd',
              'msTransitionEnd',
              'msAnimationEnd',
              'mozTransitionEnd',
              'mozAnimationEnd'
            ];

            const eventLower = arg.value.toLowerCase();
            if (animationEvents.some(event => event.toLowerCase() === eventLower)) {
              context.report({
                node,
                messageId: 'avoidTransitionWait'
              });
              return;
            }
          }
        }

        // Check for Playwright-specific animation waits
        if (node.callee.type === 'MemberExpression') {
          const object = node.callee.object;
          const property = node.callee.property;

          // page.waitForTimeout (often used for animations)
          if (object && property &&
              (object.name === 'page' || object.name === 'frame') &&
              property.name === 'waitForTimeout') {
            // Check if comment indicates animation wait
            const comments = context.getSourceCode().getCommentsBefore(node);
            const hasAnimationComment = comments.some(comment =>
              /animation|transition|css|fade|slide/i.test(comment.value)
            );

            if (hasAnimationComment) {
              context.report({
                node,
                messageId: 'avoidAnimationWait'
              });
              return;
            }
          }

          // Cypress animation-specific commands
          if (object && object.name === 'cy') {
            const animationCommands = [
              'waitForAnimations',
              'waitForAnimation',
              'ensureAnimations'
            ];

            if (animationCommands.includes(property.name)) {
              context.report({
                node,
                messageId: 'avoidAnimationWait'
              });
              return;
            }
          }
        }

        // Check for testing-library waitFor with animation-related assertions
        if (node.callee.name === 'waitFor' && node.arguments.length > 0) {
          const callback = node.arguments[0];
          if (callback && (callback.type === 'ArrowFunctionExpression' ||
                          callback.type === 'FunctionExpression')) {
            const bodyText = context.getSourceCode().getText(callback.body);
            // Check if the assertion is about animation/transition states
            if (/opacity|transform|transition|animation|fade|slide|collapse|expand/i.test(bodyText)) {
              // This might be animation-related, check more carefully
              if (/toHaveStyle.*opacity|toHaveClass.*(fade|slide|collapse|transition|animate)/i.test(bodyText)) {
                context.report({
                  node,
                  messageId: 'avoidAnimationWait'
                });
              }
            }
          }
        }
      }
    };
  }
};