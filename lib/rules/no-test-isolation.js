/**
 * @fileoverview Rule to prevent test isolation violations
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInHook, isInDescribe, isInTest, getFilename } = require('../utils/helpers');

// Regex constants to avoid repeated compilation
const LOWERCASE_START_REGEX = /^[a-z]/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent test isolation violations through shared state and missing cleanup',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-test-isolation.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowSharedSetup: {
            type: 'boolean',
            default: true,
            description: 'Allow shared setup in beforeAll/beforeEach hooks'
          },
          checkGlobalState: {
            type: 'boolean',
            default: true,
            description: 'Check for global state modifications that could affect other tests'
          },
          allowedSharedVariables: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Array of variable names that are allowed to be shared between tests'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidSharedState: 'Avoid shared mutable state "{{variable}}" that can cause test order dependencies. Initialize in beforeEach or use local variables.',
      needsCleanup: 'Test setup in {{hook}} should have corresponding cleanup in afterEach/afterAll to prevent state leakage.',
      initInSetup: 'Variable "{{variable}}" should be initialized in beforeEach/beforeAll, not directly in describe block.',
      avoidModuleMutation: 'Avoid mutating imported modules as it can affect other tests. Use mocks or local copies instead.',
      globalStateMutation: 'Avoid modifying global state "{{property}}" in tests. This can affect other tests.',
      disallowedSharedVar: 'Variable "{{variable}}" is shared between tests but not in allowedSharedVariables list.'
    }
  },

  create(context) {
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
      return {};
    }

    const options = context.options[0] || {};
    const allowSharedSetup = options.allowSharedSetup !== false;
    const checkGlobalState = options.checkGlobalState !== false;
    const allowedSharedVariables = options.allowedSharedVariables || [];

    // Track variables declared at module/describe level
    const moduleVariables = new Map();
    const describeVariables = new Map();
    const importedIdentifiers = new Set();
    const reportedViolations = new Set();
    const pendingReports = [];

    // Helper function to determine if we should report global mutation
    function shouldReportGlobalMutation(node) {
      const inSetupHook = isInHook(node, ['beforeEach', 'beforeAll']);
      const inCleanupHook = isInHook(node, ['afterEach', 'afterAll']);
      // Report if: not in any hook OR in setup hook without allowSharedSetup
      return (!inSetupHook && !inCleanupHook) || (inSetupHook && !allowSharedSetup);
    }

    // Checks if a variable declaration contains mutable content (objects, arrays, etc.)
    // let and var are always mutable regardless of their initializer
    function hasMutableContent(node) {
      if (node.kind !== 'const') {
        return true; // let/var are always mutable
      }

      // For const declarations, check if any declarator is a mutable value
      return node.declarations.some(declarator => {
        if (!declarator.init) return true;

        // Simple literals are immutable
        if (declarator.init.type === 'Literal') {
          return false;
        }

        // All object expressions are mutable regardless of their initial properties
        // Both empty objects {} and objects with properties {x: 1} can be mutated
        if (declarator.init.type === 'ObjectExpression') {
          return true; // Objects are always mutable - properties can be added, modified, or deleted
        }

        // Arrays are also always mutable
        if (declarator.init.type === 'ArrayExpression') {
          return true; // Arrays are always mutable - elements can be added, modified, or removed
        }

        return true;
      });
    }

    function isInTestContext(node) {
      return isInTest(node) || isInHook(node, ['beforeEach', 'beforeAll', 'afterEach', 'afterAll']);
    }

    // Pre-compile static cleanup patterns to avoid repeated compilation
    const staticCleanupPatterns = [
      /\.mockRestore\(\)/,
      /\.restore\(\)/,
      /\.resetAllMocks\(\)/,
      /\.clearAllMocks\(\)/,
      /\.resetModules\(\)/,
      /document\.body\.innerHTML\s*=\s*['"]/,
      /\.removeChild\(/,
      /\.remove\(\)/,
      /clearInterval\(/,
      /clearTimeout\(/
    ];

    function findCleanupForSetup(setupHook, _setupNode) {
      const sourceCode = context.getSourceCode();
      const text = sourceCode.getText();

      // Determine corresponding cleanup hook
      let cleanupHook;
      if (setupHook === 'beforeEach') {
        cleanupHook = 'afterEach';
      } else if (setupHook === 'beforeAll') {
        cleanupHook = 'afterAll';
      } else {
        return false;
      }

      // Create dynamic pattern for the specific cleanup hook
      const hookPattern = new RegExp(`${cleanupHook}\\s*\\(`);

      // Check hook pattern first
      if (hookPattern.test(text)) {
        return true;
      }

      // Check static patterns (no global flags, so no need to reset lastIndex)
      return staticCleanupPatterns.some(pattern => pattern.test(text));
    }

    function hasSetupInitialization(variableName) {
      const sourceCode = context.getSourceCode();
      const ast = sourceCode.ast;
      const visited = new Set();

      function checkAssignmentInHook(hookCallNode) {
        if (!hookCallNode.arguments || hookCallNode.arguments.length < 1) {
          return false;
        }

        const callbackFn = hookCallNode.arguments[0];
        if (!callbackFn || (callbackFn.type !== 'FunctionExpression' && callbackFn.type !== 'ArrowFunctionExpression')) {
          return false;
        }

        const body = callbackFn.body;
        if (!body) return false;

        // Handle both BlockStatement and direct expression for arrow functions
        const statements = body.type === 'BlockStatement' ? body.body : [body];

        return statements.some(statement => {
          // Check for direct assignment: variableName = ...
          if (statement.type === 'ExpressionStatement' &&
              statement.expression.type === 'AssignmentExpression' &&
              statement.expression.left.type === 'Identifier' &&
              statement.expression.left.name === variableName) {
            return true;
          }

          // Check for UpdateExpression (e.g., variableName++)
          if (statement.type === 'ExpressionStatement' &&
              statement.expression.type === 'UpdateExpression' &&
              statement.expression.argument.type === 'Identifier' &&
              statement.expression.argument.name === variableName) {
            return true;
          }

          // Check for member expression assignments (e.g., variableName.prop = ...)
          if (statement.type === 'ExpressionStatement' &&
              statement.expression.type === 'AssignmentExpression' &&
              statement.expression.left.type === 'MemberExpression' &&
              statement.expression.left.object.type === 'Identifier' &&
              statement.expression.left.object.name === variableName) {
            return true;
          }

          return false;
        });
      }

      // Traverse the AST to find beforeEach/beforeAll calls
      let found = false;
      function traverse(node) {
        if (found || !node || visited.has(node)) return;
        visited.add(node);

        if (node.type === 'CallExpression' &&
            node.callee.type === 'Identifier' &&
            (node.callee.name === 'beforeEach' || node.callee.name === 'beforeAll')) {
          if (checkAssignmentInHook(node)) {
            found = true;
            return;
          }
        }

        // Only traverse certain node types to avoid circular references
        const traversableKeys = ['body', 'declarations', 'expression', 'arguments', 'callee', 'left', 'right', 'init', 'test', 'consequent', 'alternate'];

        for (const key of traversableKeys) {
          if (found) break; // Early exit if already found

          if (node[key]) {
            const child = node[key];
            if (Array.isArray(child)) {
              for (const item of child) {
                if (found) break; // Early exit if already found
                if (item && typeof item === 'object' && item.type) {
                  traverse(item);
                }
              }
            } else if (typeof child === 'object' && child.type) {
              traverse(child);
            }
          }
        }
      }

      traverse(ast);
      return found;
    }

    function reportPendingViolations() {
      // Sort by priority first, then by line and column
      // Priority order:
      // 1. avoidSharedState violations (priority 0)
      // 2. initInSetup violations (priority 1)
      // 3. avoidModuleMutation violations (priority 2)
      // 4. needsCleanup violations (priority 3)
      pendingReports.sort((a, b) => {
        const getPriority = (messageId) => {
          switch (messageId) {
            case 'avoidSharedState': return 0;
            case 'initInSetup': return 1;
            case 'avoidModuleMutation': return 2;
            case 'needsCleanup': return 3;
            default: return 4;
          }
        };

        const priorityA = getPriority(a.messageId);
        const priorityB = getPriority(b.messageId);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // If same priority, sort by line and column
        if (a.node.loc.start.line !== b.node.loc.start.line) {
          return a.node.loc.start.line - b.node.loc.start.line;
        }
        return a.node.loc.start.column - b.node.loc.start.column;
      });

      pendingReports.forEach(report => {
        context.report(report);
      });

      pendingReports.length = 0;
    }

    return {
      Program(_node) {
        // Reset state for each file
        moduleVariables.clear();
        describeVariables.clear();
        importedIdentifiers.clear();
        reportedViolations.clear();
        pendingReports.length = 0;
      },

      'Program:exit'() {
        reportPendingViolations();
      },

      ImportDeclaration(node) {
        node.specifiers.forEach(spec => {
          if (spec.type === 'ImportDefaultSpecifier' ||
              spec.type === 'ImportSpecifier' ||
              spec.type === 'ImportNamespaceSpecifier') {
            importedIdentifiers.add(spec.local.name);
          }
        });
      },

      VariableDeclarator(node) {
        // Handle require() imports
        if (node.init &&
            node.init.type === 'CallExpression' &&
            node.init.callee.name === 'require' &&
            node.id.type === 'Identifier') {
          importedIdentifiers.add(node.id.name);
        }
      },

      VariableDeclaration(node) {
        const isInHookContext = isInHook(node, ['beforeEach', 'beforeAll', 'afterEach', 'afterAll']);
        const isInTestCase = isInTest(node);
        const isInDescribeBlock = isInDescribe(node);

        node.declarations.forEach(declarator => {
          if (declarator.id.type !== 'Identifier') return;

          const variableName = declarator.id.name;
          const isConstant = !hasMutableContent(node);

          // Variables at module level (outside describe/test)
          if (!isInDescribeBlock && !isInTestCase && !isInHookContext) {
            // Skip if this is in the allowedSharedVariables list
            if (!allowedSharedVariables.includes(variableName)) {
              // Only track mutable variables (non-const or const with mutable content)
              if (!isConstant) {
                moduleVariables.set(variableName, {
                  node: declarator,
                  isConstant,
                  hasInitializer: !!declarator.init
                });
              }
            }
          }
          // Variables in describe block but not in test/hook
          else if (isInDescribeBlock && !isInTestCase && !isInHookContext) {
            // Skip if this is in the allowedSharedVariables list
            if (!allowedSharedVariables.includes(variableName)) {
              // Track variables that need setup initialization
              describeVariables.set(variableName, {
                node: declarator,
                isConstant,
                hasInitializer: !!declarator.init
              });
            }
          }
        });
      },

      AssignmentExpression(node) {
        // Check for global state mutations
        if (checkGlobalState && node.left.type === 'MemberExpression') {
          let object = node.left.object;

          // Check for nested member expressions like process.env.NODE_ENV
          if (object.type === 'MemberExpression' && object.object.type === 'Identifier') {
            const rootObject = object.object.name;
            if ((rootObject === 'global' || rootObject === 'window' || rootObject === 'process') &&
                isInTestContext(node)) {
              // Skip if in setup/cleanup hooks when allowSharedSetup is true
              if (shouldReportGlobalMutation(node)) {
                const middleProp = object.property.name || object.property.value;
                pendingReports.push({
                  node,
                  messageId: 'globalStateMutation',
                  data: { property: `${rootObject}.${middleProp}` }
                });
              }
            }
          }
          // Check for direct member access like global.value or window.location
          else if (object.type === 'Identifier' &&
              (object.name === 'global' || object.name === 'window' || object.name === 'process') &&
              isInTestContext(node)) {
            // Skip if in setup/cleanup hooks when allowSharedSetup is true
            if (shouldReportGlobalMutation(node)) {
              const property = node.left.property;
              const propertyName = property.name || property.value;
              pendingReports.push({
                node,
                messageId: 'globalStateMutation',
                data: { property: `${object.name}.${propertyName}` }
              });
            }
          }
        }

        // Check for shared state mutations
        if (node.left.type === 'Identifier') {
          const variableName = node.left.name;

          // Skip assignments in beforeEach/beforeAll (these are setup, not violations)
          if (isInHook(node, ['beforeEach', 'beforeAll'])) {
            return;
          }

          // Check for imported module mutations
          if (importedIdentifiers.has(variableName) && isInTestContext(node)) {
            pendingReports.push({
              node,
              messageId: 'avoidModuleMutation'
            });
          }
          // Check if this is mutating a module-level variable in a test (but skip if it's an imported module)
          else if (moduleVariables.has(variableName) && isInTest(node)) {
            const key = `${variableName}-module-assignment`;
            if (!reportedViolations.has(key)) {
              reportedViolations.add(key);
              pendingReports.push({
                node,
                messageId: 'avoidSharedState',
                data: { variable: variableName }
              });
            }
          }
          // Check if this is mutating a describe-level variable in a test
          else if (describeVariables.has(variableName) && isInTest(node)) {
            const varInfo = describeVariables.get(variableName);
            if (varInfo.hasInitializer) {
              const key = `${variableName}-describe-initInSetup`;
              if (!reportedViolations.has(key)) {
                reportedViolations.add(key);
                pendingReports.push({
                  node: varInfo.node,
                  messageId: 'initInSetup',
                  data: { variable: variableName }
                });
              }
            } else if (!hasSetupInitialization(variableName)) {
              const key = `${variableName}-describe-assignment`;
              if (!reportedViolations.has(key)) {
                reportedViolations.add(key);
                pendingReports.push({
                  node,
                  messageId: 'avoidSharedState',
                  data: { variable: variableName }
                });
              }
            }
          }
        }

        // Check for property mutations of shared variables
        if (node.left.type === 'MemberExpression' && node.left.object.type === 'Identifier') {
          const objectName = node.left.object.name;

          // Skip property assignments in beforeEach/beforeAll
          if (isInHook(node, ['beforeEach', 'beforeAll'])) {
            return;
          }

          // Check for imported module mutations
          if (importedIdentifiers.has(objectName) && isInTestContext(node)) {
            pendingReports.push({
              node,
              messageId: 'avoidModuleMutation'
            });
          }
          // Check for shared variable property mutations (but skip if it's an imported module)
          else if ((moduleVariables.has(objectName) || describeVariables.has(objectName)) &&
              isInTest(node)) {
            const key = `${objectName}-property-assignment`;
            if (!reportedViolations.has(key)) {
              reportedViolations.add(key);
              pendingReports.push({
                node,
                messageId: 'avoidSharedState',
                data: { variable: objectName }
              });
            }
          }
        }
      },

      UpdateExpression(node) {
        // Handle increment/decrement of shared variables
        if (node.argument.type === 'Identifier') {
          const variableName = node.argument.name;

          // Skip in beforeEach/beforeAll
          if (isInHook(node, ['beforeEach', 'beforeAll'])) {
            return;
          }

          if (moduleVariables.has(variableName) && isInTest(node)) {
            const key = `${variableName}-module-update`;
            if (!reportedViolations.has(key)) {
              reportedViolations.add(key);
              pendingReports.push({
                node,
                messageId: 'avoidSharedState',
                data: { variable: variableName }
              });
            }
          }

          if (describeVariables.has(variableName) && isInTest(node)) {
            const varInfo = describeVariables.get(variableName);
            if (varInfo.hasInitializer) {
              const key = `${variableName}-describe-initInSetup`;
              if (!reportedViolations.has(key)) {
                reportedViolations.add(key);
                pendingReports.push({
                  node: varInfo.node,
                  messageId: 'initInSetup',
                  data: { variable: variableName }
                });
              }
            } else if (!hasSetupInitialization(variableName)) {
              const key = `${variableName}-describe-update`;
              if (!reportedViolations.has(key)) {
                reportedViolations.add(key);
                pendingReports.push({
                  node,
                  messageId: 'avoidSharedState',
                  data: { variable: variableName }
                });
              }
            }
          }
        }
      },

      CallExpression(node) {
        // Note: Global state modifications via CallExpression are handled in AssignmentExpression

        // Track setup hooks that might need cleanup
        if (node.callee.type === 'Identifier') {
          const hookName = node.callee.name;
          if (['beforeEach', 'beforeAll'].includes(hookName)) {
            const callback = node.arguments[0];
            if (callback) {
              const sourceCode = context.getSourceCode();
              const callbackText = sourceCode.getText(callback);

              // Check for patterns that typically need cleanup
              const needsCleanupPatterns = [
                /jest\.spyOn\(/,
                /vi\.spyOn\(/,
                /sinon\.spy\(/,
                /sinon\.stub\(/,
                /sinon\.mock\(/,
                /jest\.mock\(/,
                /vi\.mock\(/,
                /setTimeout\(/,
                /setInterval\(/,
                /document\.createElement\(/,
                /document\.body\.appendChild\(/
              ];

              // Only add global state patterns if allowSharedSetup is false
              if (!allowSharedSetup) {
                needsCleanupPatterns.push(
                  /global\.\w+\s*=/,
                  /window\.\w+\s*=/,
                  /process\.env\.\w+\s*=/
                );
              }

              const needsCleanup = needsCleanupPatterns.some(pattern => pattern.test(callbackText));

              if (needsCleanup) {
                const hasCleanup = findCleanupForSetup(hookName, node);
                if (!hasCleanup) {
                  pendingReports.push({
                    node,
                    messageId: 'needsCleanup',
                    data: { hook: hookName }
                  });
                }
              }
            }
          }
        }

        // Check for mutating method calls on shared variables
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' &&
            isInTest(node) &&
            !isInHook(node, ['beforeEach', 'beforeAll'])) {

          const objectName = node.callee.object.name;
          const method = node.callee.property.name;
          const mutatingMethods = [
            'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse',
            'fill', 'copyWithin', 'set', 'delete', 'clear', 'add'
          ];

          if ((moduleVariables.has(objectName) || describeVariables.has(objectName)) &&
              mutatingMethods.includes(method)) {
            const key = `${objectName}-method-${method}`;
            if (!reportedViolations.has(key)) {
              reportedViolations.add(key);
              pendingReports.push({
                node,
                messageId: 'avoidSharedState',
                data: { variable: objectName }
              });
            }
          }

          // Also check for non-mutating method calls on shared objects (still problematic for isolation)
          if ((moduleVariables.has(objectName) || describeVariables.has(objectName)) &&
              !mutatingMethods.includes(method) && method !== 'toString' && method !== 'valueOf') {
            // Check if this is a meaningful method call that could affect test isolation
            const meaningfulMethods = [
              'method', 'call', 'apply', 'bind', 'run', 'execute', 'perform', 'process',
              'start', 'stop', 'close', 'open', 'connect', 'disconnect', 'send', 'receive'
            ];
            const excludedMethods = [
              'abc', 'xyz', 'foo', 'bar', 'baz', 'id', 'name', 'type', 'length', 'size',
              'get', 'set', 'has', 'key', 'value', 'data', 'item', 'node', 'element'
            ];

            if (meaningfulMethods.includes(method) ||
                (LOWERCASE_START_REGEX.test(method) && !excludedMethods.includes(method))) {
              const key = `${objectName}-meaningful-method-${method}`;
              if (!reportedViolations.has(key)) {
                reportedViolations.add(key);
                pendingReports.push({
                  node,
                  messageId: 'avoidSharedState',
                  data: { variable: objectName }
                });
              }
            }
          }
        }
      }
    };
  }
};