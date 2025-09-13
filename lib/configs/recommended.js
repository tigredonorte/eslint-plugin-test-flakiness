/**
 * @fileoverview Recommended configuration for eslint-plugin-test-flakiness
 */
'use strict';

module.exports = {
  plugins: ['test-flakiness'],
  rules: {
    // High risk - These should be errors
    'test-flakiness/no-hard-coded-timeout': 'error',
    'test-flakiness/await-async-events': 'error',
    'test-flakiness/no-immediate-assertions': 'error',
    'test-flakiness/no-unconditional-wait': 'error',
    'test-flakiness/no-unmocked-network': 'warn',
    
    // Medium risk - These should be warnings
    'test-flakiness/no-index-queries': 'warn',
    'test-flakiness/no-animation-waits': 'warn',
    'test-flakiness/no-global-state-mutation': 'warn',
    'test-flakiness/no-promise-race': 'warn',
    'test-flakiness/no-element-removal-check': 'warn',
    
    // Low risk - These are off by default but available
    'test-flakiness/no-random-data': 'off',
    'test-flakiness/no-long-text-match': 'off',
    'test-flakiness/no-viewport-dependent': 'off',
    'test-flakiness/no-focus-check': 'off',
    
    // Special rules
    'test-flakiness/no-test-only': 'error',
    'test-flakiness/no-unmocked-fs': 'warn',
    'test-flakiness/no-database-operations': 'warn'
  }
};