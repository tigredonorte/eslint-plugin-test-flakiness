/**
 * @fileoverview Rule to ensure file system operations are mocked in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure file system operations are properly mocked in tests',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-unmocked-fs.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowedPaths: {
            type: 'array',
            items: { type: 'string' },
            default: []
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      unmockedFs: 'File system operation {{method}} should be mocked in tests',
      useMemfs: 'Use in-memory file system (memfs) for testing',
      avoidRealFs: 'Avoid real file system operations in tests',
      needsMock: 'File operations can fail due to permissions or parallel test execution'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowedPaths = options.allowedPaths || [];

    function isAllowedPath(node) {
      if (!node.arguments || !node.arguments[0]) return false;
      
      const firstArg = node.arguments[0];
      if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
        const path = firstArg.value;
        return allowedPaths.some(allowed => path.startsWith(allowed));
      }
      
      return false;
    }

    function checkFsModule(node) {
      // Check for require('fs') or import fs
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'fs') {
        
        if (isInMockContext(node, context)) {
          return;
        }
        
        if (isAllowedPath(node)) {
          return;
        }
        
        const method = node.callee.property.name;
        const fsMethods = [
          'readFile', 'readFileSync', 'writeFile', 'writeFileSync',
          'appendFile', 'appendFileSync', 'unlink', 'unlinkSync',
          'mkdir', 'mkdirSync', 'rmdir', 'rmdirSync',
          'readdir', 'readdirSync', 'stat', 'statSync',
          'lstat', 'lstatSync', 'exists', 'existsSync',
          'createReadStream', 'createWriteStream',
          'copyFile', 'copyFileSync', 'rename', 'renameSync',
          'rm', 'rmSync', 'cp', 'cpSync'
        ];
        
        if (fsMethods.includes(method)) {
          context.report({
            node,
            messageId: 'unmockedFs',
            data: { method: `fs.${method}` }
          });
        }
      }
    }

    function checkFsPromises(node) {
      // Check for fs.promises or fs/promises
      if (node.callee.type === 'MemberExpression') {
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText(node.callee.object);
        
        if (/fs\.promises|fsPromises/.test(text)) {
          if (!isInMockContext(node, context)) {
            const method = node.callee.property.name;
            context.report({
              node,
              messageId: 'unmockedFs',
              data: { method: `fs.promises.${method}` }
            });
          }
        }
      }
    }

    function checkPathModule(node) {
      // Check for path module operations that might involve fs
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'path') {
        
        // These path methods don't touch the file system, so they're OK
        const safeMethods = [
          'join', 'resolve', 'relative', 'dirname', 'basename',
          'extname', 'parse', 'format', 'sep', 'delimiter'
        ];
        
        const method = node.callee.property.name;
        if (!safeMethods.includes(method)) {
          // Warn about potential fs operations
          context.report({
            node,
            messageId: 'avoidRealFs'
          });
        }
      }
    }

    function checkGlobPatterns(node) {
      // Check for glob patterns which read the file system
      if (node.callee.name === 'glob' || 
          node.callee.name === 'globSync') {
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'unmockedFs',
            data: { method: node.callee.name }
          });
        }
      }
      
      // Check for fast-glob
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'fg') {
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'unmockedFs',
            data: { method: 'fast-glob' }
          });
        }
      }
    }

    function checkRimraf(node) {
      // Check for rimraf (directory removal)
      if (node.callee.name === 'rimraf' || 
          (node.callee.type === 'MemberExpression' &&
           node.callee.property.name === 'sync' &&
           node.callee.object.name === 'rimraf')) {
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'unmockedFs',
            data: { method: 'rimraf' }
          });
        }
      }
    }

    function checkFsExtra(node) {
      // Check for fs-extra operations
      if (node.callee.type === 'MemberExpression') {
        const obj = node.callee.object;
        
        if (obj.name === 'fse' || obj.name === 'fsExtra') {
          if (!isInMockContext(node, context)) {
            const method = node.callee.property.name;
            context.report({
              node,
              messageId: 'unmockedFs',
              data: { method: `fs-extra.${method}` }
            });
          }
        }
      }
    }

    function checkChildProcess(node) {
      // Check for child_process operations that might touch fs
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'child_process') {
        
        const method = node.callee.property.name;
        if (['exec', 'execSync', 'spawn', 'spawnSync'].includes(method)) {
          // These might perform file operations
          context.report({
            node,
            messageId: 'needsMock'
          });
        }
      }
    }

    return {
      CallExpression(node) {
        checkFsModule(node);
        checkFsPromises(node);
        checkPathModule(node);
        checkGlobPatterns(node);
        checkRimraf(node);
        checkFsExtra(node);
        checkChildProcess(node);
      }
    };
  }
};
