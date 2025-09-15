/**
 * @fileoverview Rule to avoid waiting for animations in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid waiting for animations which can have variable timing',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-animation-waits.md'
    },
    fixable: null,
    schema: [],
    messages: {
      avoidAnimationWait: 'Avoid waiting for animations. Disable animations in tests or use stable conditions.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    return {
      CallExpression(node) {
        // Check for waitForAnimation patterns
        if (node.callee.name === 'waitForAnimation' ||
            node.callee.name === 'waitForAnimations') {
          context.report({
            node,
            messageId: 'avoidAnimationWait'
          });
        }
        
        // Check for transitionend/animationend waits
        if (node.callee.type === 'MemberExpression' &&
            node.callee.property.name === 'waitFor') {
          const arg = node.arguments[0];
          if (arg && arg.type === 'Literal' &&
              /transitionend|animationend/.test(arg.value)) {
            context.report({
              node,
              messageId: 'avoidAnimationWait'
            });
          }
        }
      }
    };
  }
};