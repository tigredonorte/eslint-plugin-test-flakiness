/**
 * @fileoverview Strict configuration for eslint-plugin-test-flakiness
 */
'use strict';

module.exports = {
  plugins: ['test-flakiness'],
  rules: {
    'test-flakiness/no-hard-coded-timeout': ['error', {
      maxTimeout: 500,
      allowInSetup: false
    }]
  }
};