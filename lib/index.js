/**
 * @fileoverview ESLint plugin to detect flaky test patterns
 * @author eslint-plugin-test-flakiness
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const requireIndex = require('requireindex');

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// Import all rules in lib/rules
const rules = requireIndex(__dirname + '/rules');

// Import configs
const recommendedConfig = require('./configs/recommended');
const strictConfig = require('./configs/strict');

module.exports = {
  rules,
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
    all: {
      plugins: ['test-flakiness'],
      rules: Object.keys(rules).reduce((acc, ruleName) => {
        acc[`test-flakiness/${ruleName}`] = 'error';
        return acc;
      }, {})
    }
  }
};