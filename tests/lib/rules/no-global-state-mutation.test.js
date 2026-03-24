/**
 * @fileoverview Tests for no-global-state-mutation rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-global-state-mutation');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-global-state-mutation', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'window.globalVar = "value"',
      filename: 'src/app.js'
    },
    {
      code: 'global.config = {}',
      filename: 'src/config.js'
    },

    // Local variables are fine
    {
      code: 'const localVar = "value"',
      filename: 'Local.test.js'
    },
    {
      code: 'let testData = { key: "value" }',
      filename: 'TestData.test.js'
    },
    {
      code: 'function test() { const x = 1; }',
      filename: 'Function.test.js'
    },

    // Reading global state is okay
    {
      code: 'const value = window.location.href',
      filename: 'Read.test.js'
    },
    {
      code: 'if (global.DEBUG) { console.log("debug") }',
      filename: 'ReadGlobal.test.js'
    },
    {
      code: 'expect(window.innerWidth).toBeGreaterThan(0)',
      filename: 'Expect.test.js'
    },

    // Mocking is allowed
    {
      code: 'jest.spyOn(window, "alert").mockImplementation(() => {})',
      filename: 'Mock.test.js'
    },
    {
      code: 'vi.stubGlobal("fetch", mockFetch)',
      filename: 'Stub.test.js'
    },
    {
      code: 'sinon.stub(global, "setTimeout")',
      filename: 'Sinon.test.js'
    },

    // In beforeEach/afterEach for cleanup
    {
      code: 'beforeEach(() => { window.testState = {}; })',
      filename: 'Setup.test.js'
    },
    {
      code: 'afterEach(() => { delete window.testState; })',
      filename: 'Cleanup.test.js'
    },

    // localStorage/sessionStorage with proper cleanup
    {
      code: 'afterEach(() => { localStorage.clear(); })',
      filename: 'LocalStorageClear.test.js'
    },
    {
      code: 'beforeEach(() => { sessionStorage.clear(); })',
      filename: 'SessionStorageClear.test.js'
    },

    // Module-scoped variables in test files (debatable but often needed)
    {
      code: 'let testHelper; beforeEach(() => { testHelper = new TestHelper(); })',
      filename: 'TestHelper.test.js'
    },

    // allowInHooks: true (default) - global mutations allowed in hooks
    {
      code: 'beforeEach(() => { window.testData = "value"; })',
      filename: 'HooksAllowed.test.js',
      options: [{ allowInHooks: true }]
    },
    {
      code: 'afterEach(() => { delete global.testVar; })',
      filename: 'HooksGlobalDelete.test.js',
      options: [{ allowInHooks: true }]
    },
    {
      code: 'beforeEach(() => { localStorage.clear(); })',
      filename: 'HooksLocalStorage.test.js',
      options: [{ allowInHooks: true }]
    },

    // Valid: non-assignment expressions are ignored (line 51 coverage)
    {
      code: 'window.location.href',
      filename: 'NonAssignment.test.js'
    },
    {
      code: 'typeof window.test',
      filename: 'TypeofExpression.test.js'
    },

    // Valid: assignments to non-MemberExpressions (line 57 coverage)
    {
      code: 'let test = "value"',
      filename: 'SimpleAssignment.test.js'
    },
    {
      code: 'const obj = {}',
      filename: 'ConstDeclaration.test.js'
    },

    // Valid: process.env mutations in hooks
    {
      code: 'beforeEach(() => { process.env.TEST_VAR = "value"; })',
      filename: 'ProcessEnvInHook.test.js'
    },

    // Valid: nested global mutations with process.env in beforeEach/afterEach (line 99-108 coverage)
    {
      code: 'beforeEach(() => { window.location.href = "test"; })',
      filename: 'NestedInBeforeEach.test.js',
      options: [{ allowInHooks: true }]
    },
    {
      code: 'afterEach(() => { global.app.config = {}; })',
      filename: 'NestedInAfterEach.test.js',
      options: [{ allowInHooks: true }]
    },
    {
      code: 'afterAll(() => { window.test = null; })',
      filename: 'WindowInAfterAll.test.js',
      options: [{ allowInHooks: true }]
    },

    // Valid: non-global object assignments (line 131 coverage)
    {
      code: 'const myObj = {}; myObj.prop = "value"',
      filename: 'LocalObjectAssignment.test.js'
    },
    {
      code: 'this.prop = "value"',
      filename: 'ThisAssignment.test.js'
    },

    // Valid: non-dangerous method calls (line 229 coverage)
    {
      code: 'localStorage.getItem("key")',
      filename: 'SafeLocalStorageRead.test.js'
    },
    {
      code: 'document.getElementById("test")',
      filename: 'SafeDocumentRead.test.js'
    },
    {
      code: 'window.location.toString()',
      filename: 'SafeWindowMethod.test.js'
    },

    // Valid: console method calls are allowed (line 233-235 coverage)
    {
      code: 'console.log("test")',
      filename: 'ConsoleLog.test.js'
    },
    {
      code: 'console.error("error")',
      filename: 'ConsoleError.test.js'
    },
    {
      code: 'console.warn("warning")',
      filename: 'ConsoleWarn.test.js'
    },

    // Valid: delete on non-UnaryExpression (line 307 coverage)
    {
      code: 'const test = delete obj.prop',
      filename: 'DeleteLocalObject.test.js'
    },

    // Valid: delete on non-MemberExpression (line 311 coverage)
    {
      code: 'delete "test"',
      filename: 'DeleteLiteral.test.js'
    },
    {
      code: 'delete 123',
      filename: 'DeleteNumber.test.js'
    },

    // Valid: getScope fallback test (line 266 coverage)
    {
      code: 'const testVar = "test"; testVar = "new value"',
      filename: 'ReassignLocalVar.test.js'
    }
  ],

  invalid: [
    // Direct window property mutation
    {
      code: 'window.testData = "value"',
      filename: 'Window.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },
    {
      code: 'window.config = { key: "value" }',
      filename: 'WindowConfig.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },
    {
      code: 'window.location.href = "http://example.com"',
      filename: 'WindowLocation.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },

    // Direct global property mutation
    {
      code: 'global.testVar = 123',
      filename: 'Global.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },
    {
      code: 'global.config = {}',
      filename: 'GlobalConfig.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },
    {
      code: 'global.process.env.TEST = "value"',
      filename: 'GlobalProcess.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },

    // process.env mutations
    {
      code: 'process.env.NODE_ENV = "test"',
      filename: 'ProcessEnv.test.js',
      errors: [{
        messageId: 'avoidProcessEnv'
      }]
    },
    {
      code: 'process.env.API_KEY = "secret"',
      filename: 'ApiKey.test.js',
      errors: [{
        messageId: 'avoidProcessEnv'
      }]
    },
    {
      code: 'delete process.env.DEBUG',
      filename: 'DeleteEnv.test.js',
      errors: [{
        messageId: 'avoidProcessEnv'
      }]
    },

    // localStorage mutations without cleanup
    {
      code: 'localStorage.setItem("key", "value")',
      filename: 'LocalStorage.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { storage: 'localStorage' }
      }]
    },
    {
      code: 'localStorage.removeItem("key")',
      filename: 'LocalStorageRemove.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { storage: 'localStorage' }
      }]
    },
    {
      code: 'localStorage.key = "value"',
      filename: 'LocalStorageDirect.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { storage: 'localStorage' }
      }]
    },

    // sessionStorage mutations without cleanup
    {
      code: 'sessionStorage.setItem("key", "value")',
      filename: 'SessionStorage.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { storage: 'sessionStorage' }
      }]
    },
    {
      code: 'sessionStorage.removeItem("key")',
      filename: 'SessionStorageRemove.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { storage: 'sessionStorage' }
      }]
    },

    // document mutations
    {
      code: 'document.title = "New Title"',
      filename: 'DocumentTitle.test.js',
      errors: [{
        messageId: 'avoidDocumentMutation'
      }]
    },
    {
      code: 'document.body.innerHTML = "<div>test</div>"',
      filename: 'DocumentBody.test.js',
      errors: [{
        messageId: 'avoidDocumentMutation'
      }]
    },
    {
      code: 'document.cookie = "test=value"',
      filename: 'DocumentCookie.test.js',
      errors: [{
        messageId: 'avoidDocumentMutation'
      }]
    },

    // Global function overrides
    {
      code: 'window.alert = () => {}',
      filename: 'OverrideAlert.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },
    {
      code: 'console.log = jest.fn()',
      filename: 'ConsoleOverride.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'console' }
      }]
    },
    {
      code: 'Math.random = () => 0.5',
      filename: 'MathOverride.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'Math' }
      }]
    },
    {
      code: 'Date.now = () => 1234567890',
      filename: 'DateOverride.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'Date' }
      }]
    },

    // Multiple violations
    {
      code: `
        window.testVar = "test";
        global.config = {};
        localStorage.setItem("key", "value");
        process.env.TEST = "1";
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidGlobalMutation', data: { object: 'window' } },
        { messageId: 'avoidGlobalMutation', data: { object: 'global' } },
        { messageId: 'needsCleanup', data: { storage: 'localStorage' } },
        { messageId: 'avoidProcessEnv' }
      ]
    },

    // Nested mutations
    {
      code: 'window.myApp.config = {}',
      filename: 'NestedWindow.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },
    {
      code: 'global.myLib.state = "new"',
      filename: 'NestedGlobal.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },

    // Delete operations
    {
      code: 'delete window.myProperty',
      filename: 'DeleteWindow.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },
    {
      code: 'delete global.myVar',
      filename: 'DeleteGlobal.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },

    // allowInHooks: false - global mutations not allowed even in hooks
    {
      code: 'beforeEach(() => { window.testData = "value"; })',
      filename: 'HooksNotAllowed.test.js',
      options: [{ allowInHooks: false }],
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },
    {
      code: 'afterEach(() => { global.config = {}; })',
      filename: 'HooksGlobalNotAllowed.test.js',
      options: [{ allowInHooks: false }],
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },
    {
      code: 'beforeAll(() => { document.title = "Test"; })',
      filename: 'HooksDocumentNotAllowed.test.js',
      options: [{ allowInHooks: false }],
      errors: [{
        messageId: 'avoidDocumentMutation'
      }]
    },
    {
      code: 'afterAll(() => { delete window.customProp; })',
      filename: 'HooksDeleteNotAllowed.test.js',
      options: [{ allowInHooks: false }],
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },
    {
      code: 'beforeAll(() => { localStorage.setItem("key", "value"); })',
      filename: 'HooksStorageNotAllowed.test.js',
      options: [{ allowInHooks: false }],
      errors: [{
        messageId: 'needsCleanup',
        data: { storage: 'localStorage' }
      }]
    },

    // beforeAll hook with global mutation (line 87 coverage)
    {
      code: 'beforeAll(() => { window.config = {}; })',
      filename: 'BeforeAllGlobal.test.js',
      options: [{ allowInHooks: true }],
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },

    // process.env assignment not to be double-reported (line 98 coverage)
    {
      code: 'global.process.env.NODE_ENV = "test"',
      filename: 'GlobalProcessEnvSpecific.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },

    // Nested global assignment (line 144 coverage)
    {
      code: 'global.app.process.env.NODE_ENV = "test"',
      filename: 'NestedGlobalProcessEnv.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },

    // Global variable creation without declaration (line 244 coverage)
    {
      code: 'globalTestVar = "some value"',
      filename: 'GlobalVarCreation.test.js',
      errors: [{
        messageId: 'useLocalVariable'
      }]
    },

    // test.only usage (line 262 coverage)
    {
      code: 'test.only("should do something", () => {})',
      filename: 'TestOnly.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'test execution order' }
      }]
    },

    // describe.only usage
    {
      code: 'describe.only("test suite", () => {})',
      filename: 'DescribeOnly.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'test execution order' }
      }]
    },

    // it.only usage
    {
      code: 'it.only("should do something", () => {})',
      filename: 'ItOnly.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'test execution order' }
      }]
    },

    // Global variable assignment without let/const (covers line 216)
    {
      code: 'someGlobalVar = "test"',
      filename: 'GlobalAssignment.test.js',
      errors: [{
        messageId: 'useLocalVariable'
      }]
    },

    // Test non-assignment expression (line 51 - early return check)
    {
      code: 'window.location.href === "test" ? window.test = 1 : null',
      filename: 'ConditionalAssignment.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },

    // Test nested process.env assignment skip (line 95 - isProcessEnvAssignment check within nested global)
    {
      code: 'window.location.env = "test"',
      filename: 'WindowLocationEnv.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },

    // Test beforeAll with nested global mutation - allowInHooks true (lines 101-108)
    {
      code: 'beforeAll(() => { window.location.href = "test"; })',
      filename: 'BeforeAllNested.test.js',
      options: [{ allowInHooks: true }],
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },

    // Test beforeAll with direct global mutation - allowInHooks true
    {
      code: 'beforeAll(() => { global.testVar = "test"; })',
      filename: 'BeforeAllDirectGlobal.test.js',
      options: [{ allowInHooks: true }],
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'global' }
      }]
    },


    // Test process mutation that's not process.env (line 149 - skip process env check)
    {
      code: 'process.title = "NewTitle"',
      filename: 'ProcessTitle.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'process' }
      }]
    },

    // Test navigator mutation
    {
      code: 'navigator.userAgent = "CustomAgent"',
      filename: 'NavigatorMutation.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'navigator' }
      }]
    },

    // Test document.write call (lines 229, 250 - dangerous method not localStorage/sessionStorage)
    {
      code: 'document.write("test")',
      filename: 'DocumentWrite.test.js',
      errors: [{
        messageId: 'useLocalVariable'
      }]
    },

    // Test document.writeln call
    {
      code: 'document.writeln("test")',
      filename: 'DocumentWriteln.test.js',
      errors: [{
        messageId: 'useLocalVariable'
      }]
    },

    // Test window.addEventListener call
    {
      code: 'window.addEventListener("click", () => {})',
      filename: 'WindowAddEventListener.test.js',
      errors: [{
        messageId: 'useLocalVariable'
      }]
    },

    // Test window.removeEventListener call
    {
      code: 'window.removeEventListener("click", handler)',
      filename: 'WindowRemoveEventListener.test.js',
      errors: [{
        messageId: 'useLocalVariable'
      }]
    },

    // Test non-UnaryExpression for delete (line 307 - early return)
    {
      code: 'delete window.test',
      filename: 'BasicDelete.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },

    // Test delete with non-MemberExpression argument (line 311 - early return)
    {
      code: 'typeof window.test !== "undefined" && delete window.test',
      filename: 'ConditionalDelete.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'window' }
      }]
    },

    // Test document delete
    {
      code: 'delete document.customProp',
      filename: 'DeleteDocument.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'document' }
      }]
    },

    // Test process delete
    {
      code: 'delete process.customProp',
      filename: 'DeleteProcess.test.js',
      errors: [{
        messageId: 'avoidGlobalMutation',
        data: { object: 'process' }
      }]
    }
  ]
});

// Test rule schema
describe('no-global-state-mutation schema', () => {
  it('should have correct schema properties', () => {
    expect(rule.meta.schema).toHaveLength(1);
    expect(rule.meta.schema[0].type).toBe('object');
    expect(rule.meta.schema[0].properties).toHaveProperty('allowInHooks');
    expect(rule.meta.schema[0].properties.allowInHooks.type).toBe('boolean');
    expect(rule.meta.schema[0].properties.allowInHooks.default).toBe(true);
    expect(rule.meta.schema[0].additionalProperties).toBe(false);
  });
});