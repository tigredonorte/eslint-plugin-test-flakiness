/**
 * @fileoverview Utility functions for eslint-plugin-test-flakiness
 * @author eslint-plugin-test-flakiness
 */
'use strict';

/**
 * Check if a file is a test file based on naming patterns
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file is a test file
 */
function isTestFile(filename) {
  if (!filename) return false;
  
  const testPatterns = [
    /\.(test|spec)\.(js|jsx|ts|tsx|mjs|cjs)$/,
    /\.(test|spec)\.stories\.(js|jsx|ts|tsx)$/,
    /\/__tests__\//,
    /\/(test|tests|spec|specs)\//,
    /\.(e2e|integration|cy)\.(js|jsx|ts|tsx)$/,
    /\/cypress\//,
    /\/playwright\//,
    /\.steps?\.(js|jsx|ts|tsx)$/
  ];
  
  return testPatterns.some(pattern => pattern.test(filename));
}

/**
 * Check if a node is within a mock or stub context
 * @param {Object} node - The AST node to check
 * @param {Object} context - The ESLint context
 * @returns {boolean} Whether the node is in a mock context
 */
function isInMockContext(node, context) {
  // Check if the node itself is a mock call
  if (node.callee) {
    const calleeText = context.getSourceCode().getText(node.callee);
    
    // Common mock patterns
    const mockPatterns = [
      /^jest\./,
      /^vi\./,
      /^sinon\./,
      /^mock/i,
      /^stub/i,
      /^spy/i,
      /^fake/i,
      /\.mock/,
      /\.spyOn/,
      /\.stub/,
      /\.fake/
    ];
    
    if (mockPatterns.some(pattern => pattern.test(calleeText))) {
      return true;
    }
  }
  
  // Check parent context (look up to 5 levels)
  let parent = node.parent;
  let level = 0;
  
  while (parent && level < 5) {
    if (parent.type === 'CallExpression') {
      const calleeText = context.getSourceCode().getText(parent.callee);
      
      // Check for mock setup functions
      if (/mock|stub|spy|fake|jest\.fn|vi\.fn|sinon\./i.test(calleeText)) {
        return true;
      }
      
      // Check for jest.mock() or vi.mock() module mocking
      if (parent.callee.type === 'MemberExpression') {
        const object = parent.callee.object.name;
        const method = parent.callee.property.name;
        if ((object === 'jest' || object === 'vi') && method === 'mock') {
          return true;
        }
      }
    }
    
    parent = parent.parent;
    level++;
  }
  
  return false;
}

/**
 * Check if a node is within a specific test hook
 * @param {Object} node - The AST node to check
 * @param {Array<string>} hookNames - Hook names to check for
 * @returns {boolean} Whether the node is in one of the specified hooks
 */
function isInHook(node, hookNames) {
  let parent = node.parent;
  
  while (parent) {
    if (parent.type === 'CallExpression' && 
        parent.callee.type === 'Identifier' &&
        hookNames.includes(parent.callee.name)) {
      return true;
    }
    parent = parent.parent;
  }
  
  return false;
}

/**
 * Check if a node is within a describe block
 * @param {Object} node - The AST node to check
 * @returns {boolean} Whether the node is in a describe block
 */
function isInDescribe(node) {
  let parent = node.parent;
  
  while (parent) {
    if (parent.type === 'CallExpression' && 
        parent.callee.type === 'Identifier' &&
        (parent.callee.name === 'describe' || 
         parent.callee.name === 'context' ||
         parent.callee.name === 'suite')) {
      return true;
    }
    parent = parent.parent;
  }
  
  return false;
}

/**
 * Check if a node is within a test case
 * @param {Object} node - The AST node to check
 * @returns {boolean} Whether the node is in a test case
 */
function isInTest(node) {
  let parent = node.parent;
  
  while (parent) {
    if (parent.type === 'CallExpression' && 
        parent.callee.type === 'Identifier') {
      const name = parent.callee.name;
      if (name === 'it' || name === 'test' || name === 'specify') {
        return true;
      }
    }
    parent = parent.parent;
  }
  
  return false;
}

/**
 * Get the filename from ESLint context (compatible with v7, v8, and v9)
 * @param {Object} context - The ESLint context
 * @returns {string} The filename
 */
function getFilename(context) {
  // ESLint 9+ uses context.filename
  if (context.filename) return context.filename;
  // ESLint 8 uses getPhysicalFilename() or getFilename()
  if (context.getPhysicalFilename) return context.getPhysicalFilename();
  // ESLint 7 uses getFilename()
  if (context.getFilename) return context.getFilename();
  return '';
}

/**
 * Get the test framework being used
 * @param {Object} context - The ESLint context
 * @returns {string|null} The test framework name or null
 */
function getTestFramework(context) {
  const filename = getFilename(context);
  const sourceCode = context.getSourceCode();
  const text = sourceCode.getText();
  
  // Check imports/requires
  if (/from ['"]@testing-library/.test(text)) {
    return 'testing-library';
  }
  if (/from ['"]@playwright/.test(text)) {
    return 'playwright';
  }
  if (/from ['"]cypress/.test(text)) {
    return 'cypress';
  }
  if (/from ['"]vitest/.test(text)) {
    return 'vitest';
  }
  if (/from ['"]jest/.test(text)) {
    return 'jest';
  }
  
  // Check global usage
  if (/\b(describe|it|expect)\s*\(/.test(text)) {
    if (/\bvi\./.test(text)) return 'vitest';
    if (/\bjest\./.test(text)) return 'jest';
    if (/\bcy\./.test(text)) return 'cypress';
  }
  
  // Check file path
  if (/\/cypress\//i.test(filename)) return 'cypress';
  if (/\/playwright\//i.test(filename)) return 'playwright';
  if (/\.cy\./i.test(filename)) return 'cypress';
  if (/\.spec\./i.test(filename)) return 'jest'; // Default assumption
  
  return null;
}

/**
 * Check if an expression is a promise or async function
 * @param {Object} node - The AST node to check
 * @returns {boolean} Whether the node returns a promise
 */
function isPromise(node) {
  if (!node) return false;
  
  // Async function
  if (node.async) return true;
  
  // Promise constructor
  if (node.type === 'NewExpression' && node.callee.name === 'Promise') {
    return true;
  }
  
  // Method that typically returns promises
  if (node.type !== 'CallExpression') {
    return false;
  }
  
  if (node.callee.type === 'MemberExpression') {
    const method = node.callee.property.name;
    const promiseMethods = [
      'then', 'catch', 'finally',
      'all', 'race', 'allSettled', 'any',
      'resolve', 'reject'
    ];
    if (promiseMethods.includes(method)) {
      return true;
    }
  }
  
  // Common async method patterns
  const calleeText = node.callee.name || '';
  if (/^(fetch|axios|request|get|post|put|delete|patch)/i.test(calleeText)) {
    return true;
  }
  return false;
}

/**
 * Get the indentation string for a node
 * @param {Object} node - The AST node
 * @param {Object} context - The ESLint context
 * @returns {string} The indentation string
 */
function getIndentation(node, context) {
  const sourceCode = context.getSourceCode();
  const token = sourceCode.getFirstToken(node);
  if (!token) {
    return '';
  }

  const line = sourceCode.lines[token.loc.start.line - 1];
  if (!line) {
    return '';
  }

  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

/**
 * Check if a string is likely a URL
 * @param {string} str - The string to check
 * @returns {boolean} Whether the string looks like a URL
 */
function isUrl(str) {
  return /^(https?:\/\/|wss?:\/\/|\/\/)/.test(str);
}

/**
 * Check if a string is a data URL
 * @param {string} str - The string to check
 * @returns {boolean} Whether the string is a data URL
 */
function isDataUrl(str) {
  return /^(data:|blob:|file:)/.test(str);
}

module.exports = {
  isTestFile,
  isInMockContext,
  isInHook,
  isInDescribe,
  isInTest,
  getTestFramework,
  isPromise,
  getIndentation,
  isUrl,
  isDataUrl,
  getFilename
};