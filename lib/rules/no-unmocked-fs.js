/**
 * @fileoverview Rule to ensure file system operations are mocked in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext, getFilename } = require('../utils/helpers');
const os = require('os');

const FS_METHODS = [
  'readFile', 'readFileSync', 'writeFile', 'writeFileSync',
  'appendFile', 'appendFileSync', 'unlink', 'unlinkSync',
  'mkdir', 'mkdirSync', 'rmdir', 'rmdirSync',
  'readdir', 'readdirSync', 'stat', 'statSync',
  'lstat', 'lstatSync', 'exists', 'existsSync',
  'access', 'accessSync', 'watch', 'watchFile',
  'createReadStream', 'createWriteStream',
  'copyFile', 'copyFileSync', 'rename', 'renameSync',
  'rm', 'rmSync', 'cp', 'cpSync'
];

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
          },
          allowInSetup: {
            type: 'boolean',
            default: false
          },
          allowTempFiles: {
            type: 'boolean',
            default: true
          },
          allowedModules: {
            type: 'array',
            items: { type: 'string' },
            default: []
          },
          mockModules: {
            type: 'array',
            items: { type: 'string' },
            default: ['fs', 'fs/promises', 'node:fs']
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      mockFs: 'File system operation {{method}} should be mocked in tests to prevent flakiness',
      unmockedFs: 'Unmocked {{method}} operation can cause test flakiness - consider using jest.mock() or memfs',
      useMemfs: 'Consider using in-memory file system (memfs) instead of {{method}} for more reliable tests',
      avoidRealFs: 'Avoid real file system operations in tests to prevent environment-dependent failures',
      needsMock: 'File operations can fail due to permissions or parallel test execution - use mocking instead'
    }
  },

  create(context) {
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
      return {};
    }

    const options = context.options[0] || {};
    const allowedPaths = options.allowedPaths || [];
    const allowInSetup = options.allowInSetup || false;
    const allowTempFiles = options.allowTempFiles !== false; // default true
    const allowedModules = options.allowedModules || [];
    const mockModules = options.mockModules || ['fs', 'fs/promises', 'node:fs'];

    function isInSetupHook(node) {
      let parent = node;
      while (parent) {
        if (parent.type === 'CallExpression' && parent.callee) {
          const calleeName = parent.callee.name || (parent.callee.property && parent.callee.property.name);
          if (calleeName && ['beforeAll', 'beforeEach', 'afterAll', 'afterEach', 'before', 'after', 'setup', 'teardown'].includes(calleeName)) {
            return true;
          }
        }
        // Check for arrow functions or function expressions that might be inside setup hooks
        if ((parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionExpression') && parent.parent) {
          const grandParent = parent.parent;
          if (grandParent.type === 'CallExpression' && grandParent.callee) {
            const calleeName = grandParent.callee.name || (grandParent.callee.property && grandParent.callee.property.name);
            if (calleeName && ['beforeAll', 'beforeEach', 'afterAll', 'afterEach', 'before', 'after', 'setup', 'teardown'].includes(calleeName)) {
              return true;
            }
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    function isTempPath(pathStr) {
      if (!pathStr || typeof pathStr !== 'string') return false;

      // Check if path starts with or contains temp directory patterns
      const tempPatterns = [
        os.tmpdir(),
        '/tmp/',
        '/var/tmp/',
        'C:\\Temp\\',
        'C:\\Windows\\Temp\\',
        '/private/tmp/',
        '/private/var/folders/' // macOS temp
      ];

      const normalizedPath = pathStr.replace(/\\/g, '/');
      return tempPatterns.some(pattern => {
        const normalizedPattern = pattern.replace(/\\/g, '/');
        return normalizedPath.includes(normalizedPattern) ||
               normalizedPath.startsWith(normalizedPattern);
      });
    }

    function isAllowedPath(node) {
      if (!node.arguments || !node.arguments[0]) return false;

      const firstArg = node.arguments[0];
      if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
        const pathValue = firstArg.value;

        // Check allowed paths
        if (allowedPaths.some(allowed => pathValue.startsWith(allowed))) {
          return true;
        }

        // Check fixtures
        if (pathValue.includes('__fixtures__') ||
            pathValue.includes('/fixtures/') ||
            pathValue.startsWith('./test/fixtures/')) {
          return true;
        }

        // Check temp files if allowed
        if (allowTempFiles && isTempPath(pathValue)) {
          return true;
        }

        return false;
      }

      // Check for path.join() calls
      if (firstArg.type === 'CallExpression' &&
          firstArg.callee.type === 'MemberExpression' &&
          firstArg.callee.object.name === 'path' &&
          firstArg.callee.property.name === 'join') {

        // Check if any argument contains fixtures or temp
        const sourceCode = context.getSourceCode();
        const args = firstArg.arguments;
        for (const arg of args) {
          const argText = sourceCode.getText(arg);
          if (argText.includes('__fixtures__') || argText.includes('fixtures')) {
            return true;
          }
          // Check for os.tmpdir() calls
          if (allowTempFiles && (argText.includes('os.tmpdir()') || argText.includes('tmpdir()'))) {
            return true;
          }
        }
      }

      return false;
    }

    function isModuleMocked(_node, moduleName = null) {
      const sourceCode = context.getSourceCode();
      const text = sourceCode.getText();

      // Build mock patterns for the modules that should be mocked
      const mockPatterns = [];

      // If checking for a specific module
      if (moduleName) {
        const escapedName = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        mockPatterns.push(
          new RegExp(`jest\\.mock\\s*\\(\\s*["']${escapedName}["']\\s*\\)`),
          new RegExp(`vi\\.mock\\s*\\(\\s*["']${escapedName}["']\\s*\\)`)
        );
      } else {
        // Check for all modules that should be mocked
        for (const mod of mockModules) {
          const escapedMod = mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          mockPatterns.push(
            new RegExp(`jest\\.mock\\s*\\(\\s*["']${escapedMod}["']\\s*\\)`),
            new RegExp(`vi\\.mock\\s*\\(\\s*["']${escapedMod}["']\\s*\\)`)
          );
        }
      }

      // Always check for mock-fs and memfs as they provide mocked fs
      mockPatterns.push(
        /import.*from.*["']mock-fs["']/,
        /require\s*\(\s*["']mock-fs["']\s*\)/,
        /import.*from.*["']memfs["']/,
        /require\s*\(\s*["']memfs["']\s*\)/
      );

      return mockPatterns.some(pattern => pattern.test(text));
    }

    function isAllowedModule(moduleName) {
      return allowedModules.includes(moduleName);
    }

    function checkFsModule(node) {
      // Check for require('fs') or import fs
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'fs') {

        // Check if fs module is allowed
        if (isAllowedModule('fs')) {
          return;
        }

        if (isInMockContext(node, context) || isModuleMocked(node, 'fs')) {
          return;
        }

        if (isAllowedPath(node)) {
          return;
        }

        // Check if in setup/teardown hook and allowed (after other checks)
        if (allowInSetup && isInSetupHook(node)) {
          return;
        }

        const method = node.callee.property.name;

        if (FS_METHODS.includes(method)) {
          // Use specific message based on method type
          const messageId = ['readFile', 'readFileSync', 'writeFile', 'writeFileSync'].includes(method)
            ? 'unmockedFs'
            : 'mockFs';
          context.report({
            node,
            messageId,
            data: { method: method }
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
          // Check if fs/promises module is allowed
          if (isAllowedModule('fs/promises')) {
            return;
          }

          if (!isInMockContext(node, context) && !isModuleMocked(node, 'fs/promises')) {
            if (isAllowedPath(node)) {
              return;
            }

            // Check if in setup/teardown hook and allowed (after other checks)
            if (allowInSetup && isInSetupHook(node)) {
              return;
            }

            const method = node.callee.property.name;
            context.report({
              node,
              messageId: 'unmockedFs',
              data: { method: method }
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
          node.callee.name === 'globSync' ||
          (node.callee.type === 'MemberExpression' &&
           node.callee.object.name === 'glob' &&
           node.callee.property.name === 'sync')) {

        // Check if glob module is allowed
        if (isAllowedModule('glob')) {
          return;
        }

        if (!isInMockContext(node, context)) {
          // Check if in setup/teardown hook and allowed (after other checks)
          if (allowInSetup && isInSetupHook(node)) {
            return;
          }

          const methodName = node.callee.name ||
                            (node.callee.type === 'MemberExpression' ? 'glob' : 'glob');
          context.report({
            node,
            messageId: 'useMemfs',
            data: { method: methodName }
          });
        }
      }

      // Check for fast-glob
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'fg') {

        // Check if fast-glob module is allowed
        if (isAllowedModule('fast-glob')) {
          return;
        }

        if (!isInMockContext(node, context)) {
          // Check if in setup/teardown hook and allowed (after other checks)
          if (allowInSetup && isInSetupHook(node)) {
            return;
          }

          context.report({
            node,
            messageId: 'useMemfs',
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

        // Check if rimraf module is allowed
        if (isAllowedModule('rimraf')) {
          return;
        }

        if (!isInMockContext(node, context)) {
          // Check if in setup/teardown hook and allowed (after other checks)
          if (allowInSetup && isInSetupHook(node)) {
            return;
          }

          context.report({
            node,
            messageId: 'useMemfs',
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
          // Check if fs-extra is allowed
          if (isAllowedModule('fs-extra')) {
            return;
          }

          if (!isInMockContext(node, context)) {
            if (isAllowedPath(node)) {
              return;
            }

            // Check if in setup/teardown hook and allowed (after other checks)
            if (allowInSetup && isInSetupHook(node)) {
              return;
            }

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

    function checkDestructuredImports(node) {
      // Check for destructured FS imports like const { readFileSync } = require('fs')
      if (node.callee.name && FS_METHODS.includes(node.callee.name)) {

        if (!isInMockContext(node, context) && !isModuleMocked(node)) {
          if (isAllowedPath(node)) {
            return;
          }

          // Check if in setup/teardown hook and allowed (after other checks)
          if (allowInSetup && isInSetupHook(node)) {
            return;
          }

          context.report({
            node,
            messageId: 'unmockedFs',
            data: { method: node.callee.name }
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
        checkDestructuredImports(node);
      }
    };
  }
};
