/**
 * @fileoverview Tests for no-global-state-mutation rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-global-state-mutation');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

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
    }
  ]
});