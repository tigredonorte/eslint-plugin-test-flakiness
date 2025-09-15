/**
 * @fileoverview Rule to avoid Promise.race in tests due to unpredictable timing
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid Promise.race in tests as it can lead to unpredictable results',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-promise-race.md'
    },
    fixable: null,
    schema: [],
    messages: {
      avoidPromiseRace: 'Avoid Promise.race in tests. Use Promise.all or sequential awaits for predictable behavior.',
      usePromiseAll: 'Consider using Promise.all or Promise.allSettled for deterministic results.',
      avoidRaceCondition: 'Race conditions in tests lead to flaky failures.'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    function checkPromiseRace(node) {
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Promise' &&
          node.callee.property.name === 'race') {
        
        context.report({
          node,
          messageId: 'avoidPromiseRace'
        });
      }
    }

    function checkRacePatterns(node) {
      // Check for common race condition patterns
      const sourceCode = context.getSourceCode();
      const text = sourceCode.getText(node);
      
      // Check for multiple promises with timeout patterns (common race pattern)
      if (node.type === 'ArrayExpression' && node.parent &&
          node.parent.type === 'CallExpression') {
        
        const hasTimeout = node.elements.some(el => {
          const elText = sourceCode.getText(el);
          return /timeout|delay|wait|setTimeout/.test(elText);
        });
        
        const hasPromise = node.elements.some(el => {
          const elText = sourceCode.getText(el);
          return /Promise|async|await|then/.test(elText);
        });
        
        if (hasTimeout && hasPromise && node.elements.length > 1) {
          // Check if parent is Promise.race
          const parent = node.parent;
          if (parent.callee && parent.callee.property && 
              parent.callee.property.name === 'race') {
            // Already reported by checkPromiseRace
            return;
          }
          
          // Warn about potential race condition pattern
          context.report({
            node: node.parent,
            messageId: 'avoidRaceCondition'
          });
        }
      }
    }

    function checkCustomRaceImplementations(node) {
      // Check for custom implementations of race conditions
      if (node.type === 'CallExpression') {
        const calleeName = node.callee.name || 
                         (node.callee.property && node.callee.property.name);
        
        // Common custom race function names
        const racePatterns = [
          'race',
          'firstOf',
          'fastest',
          'quickest',
          'firstToResolve',
          'raceWithTimeout',
          'timeoutRace'
        ];
        
        if (calleeName && racePatterns.includes(calleeName)) {
          context.report({
            node,
            messageId: 'usePromiseAll'
          });
        }
      }
    }

    function checkParallelWithoutSync(node) {
      // Check for Promise.all with operations that might race
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Promise' &&
          node.callee.property.name === 'all') {
        
        const arg = node.arguments[0];
        if (arg && arg.type === 'ArrayExpression') {
          const sourceCode = context.getSourceCode();
          
          // Check if array contains state mutations or DOM operations
          const hasMutations = arg.elements.some(el => {
            if (!el) return false;
            const text = sourceCode.getText(el);
            return /setState|dispatch|click|type|fireEvent/.test(text);
          });
          
          if (hasMutations) {
            context.report({
              node,
              messageId: 'avoidRaceCondition'
            });
          }
        }
      }
    }

    return {
      CallExpression(node) {
        checkPromiseRace(node);
        checkCustomRaceImplementations(node);
        checkParallelWithoutSync(node);
      },
      ArrayExpression(node) {
        checkRacePatterns(node);
      }
    };
  }
};
