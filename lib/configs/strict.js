/**
 * @fileoverview Strict configuration for eslint-plugin-test-flakiness
 */
'use strict';

module.exports = {
  plugins: ['test-flakiness'],
  rules: {
    // All high risk patterns are errors
    'test-flakiness/no-hard-coded-timeout': 'error',
    'test-flakiness/await-async-events': 'error',
    'test-flakiness/no-immediate-assertions': 'error',
    'test-flakiness/no-unconditional-wait': 'error',
    'test-flakiness/no-unmocked-network': 'error',
    'test-flakiness/no-promise-race': 'error',
    
    // Medium risk patterns are also errors in strict mode
    'test-flakiness/no-index-queries': 'error',
    'test-flakiness/no-animation-waits': 'error',
    'test-flakiness/no-global-state-mutation': 'error',
    'test-flakiness/no-element-removal-check': 'error',
    'test-flakiness/no-unmocked-fs': 'error',
    'test-flakiness/no-database-operations': 'error',
    
    // Low risk patterns are warnings in strict mode
    'test-flakiness/no-random-data': 'warn',
    'test-flakiness/no-long-text-match': 'warn',
    'test-flakiness/no-viewport-dependent': 'warn',
    'test-flakiness/no-focus-check': 'warn',
    
    // Special rules
    'test-flakiness/no-test-only': 'error'
  }
};