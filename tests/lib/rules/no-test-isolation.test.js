/**
 * @fileoverview Tests for no-test-isolation rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-test-isolation');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-test-isolation', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'let sharedState = {}',
      filename: 'src/app.js'
    },
    {
      code: 'export const config = { key: "value" }',
      filename: 'src/config.js'
    },

    // Local variables inside test blocks
    {
      code: 'it("test", () => { let localVar = 1; })',
      filename: 'Local.test.js'
    },
    {
      code: 'test("test", () => { const data = {}; })',
      filename: 'TestLocal.test.js'
    },
    {
      code: 'describe("suite", () => { it("test", () => { let x = 1; }) })',
      filename: 'DescribeLocal.test.js'
    },

    // Variables initialized in beforeEach
    {
      code: 'let data; beforeEach(() => { data = {}; })',
      filename: 'BeforeEach.test.js'
    },
    {
      code: 'let component; beforeEach(() => { component = render(<App />); })',
      filename: 'ComponentSetup.test.js'
    },
    {
      code: 'describe("suite", () => { let state; beforeEach(() => { state = createState(); }) })',
      filename: 'DescribeSetup.test.js'
    },

    // Using afterEach for cleanup
    {
      code: 'let server; beforeEach(() => { server = createServer(); }); afterEach(() => { server.close(); })',
      filename: 'ServerCleanup.test.js'
    },
    {
      code: 'let mock; beforeEach(() => { mock = jest.fn(); }); afterEach(() => { mock.mockClear(); })',
      filename: 'MockCleanup.test.js'
    },

    // Constants are generally okay
    {
      code: 'const TEST_DATA = { id: 1, name: "test" }',
      filename: 'Constants.test.js'
    },
    {
      code: 'const TIMEOUT = 5000',
      filename: 'ConstantTimeout.test.js'
    },

    // Inside describe blocks with proper setup
    {
      code: `describe("suite", () => {
        let value;
        beforeEach(() => { value = 0; });
        it("test", () => { value++; });
      })`,
      filename: 'DescribeProper.test.js'
    },

    // Read-only operations
    {
      code: 'const config = getConfig(); it("test", () => { expect(config.value).toBe(1); })',
      filename: 'ReadOnly.test.js'
    }
  ],

  invalid: [
    // Shared mutable state at module level
    {
      code: 'let counter = 0; it("test1", () => { counter++; }); it("test2", () => { counter++; });',
      filename: 'Counter.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'counter' }
      }]
    },
    {
      code: 'let sharedData = {}; test("test", () => { sharedData.value = 1; });',
      filename: 'SharedData.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'sharedData' }
      }]
    },
    {
      code: 'let array = []; it("test", () => { array.push(1); });',
      filename: 'Array.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'array' }
      }]
    },

    // Missing cleanup
    {
      code: 'let spy; beforeEach(() => { spy = jest.spyOn(console, "log"); });',
      filename: 'SpyNoCleanup.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { hook: 'beforeEach' }
      }]
    },
    {
      code: 'let stub; beforeAll(() => { stub = sinon.stub(api, "fetch"); });',
      filename: 'StubNoCleanup.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { hook: 'beforeAll' }
      }]
    },

    // Shared state in describe block without initialization
    {
      code: `describe("suite", () => {
        let value = 0;
        it("test1", () => { value++; });
        it("test2", () => { expect(value).toBe(1); });
      })`,
      filename: 'DescribeShared.test.js',
      errors: [{
        messageId: 'initInSetup',
        data: { variable: 'value' }
      }]
    },
    {
      code: `describe("suite", () => {
        let component = null;
        it("test", () => { component = render(<App />); });
      })`,
      filename: 'ComponentNoSetup.test.js',
      errors: [{
        messageId: 'initInSetup',
        data: { variable: 'component' }
      }]
    },

    // Test depending on previous test
    {
      code: `
        let result;
        it("test1", () => { result = calculate(); });
        it("test2", () => { expect(result).toBe(42); });
      `,
      filename: 'Dependency.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'result' }
      }]
    },

    // Modifying imported modules
    {
      code: 'import config from "./config"; it("test", () => { config.value = 1; });',
      filename: 'ImportMutation.test.js',
      errors: [{
        messageId: 'avoidModuleMutation'
      }]
    },
    {
      code: 'const api = require("./api"); test("test", () => { api.endpoint = "new"; });',
      filename: 'RequireMutation.test.js',
      errors: [{
        messageId: 'avoidModuleMutation'
      }]
    },

    // Multiple test files sharing state (if detectable)
    {
      code: 'export let sharedState = {}; it("test", () => { sharedState.value = 1; });',
      filename: 'ExportState.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'sharedState' }
      }]
    },

    // Order-dependent tests
    {
      code: `
        let users = [];
        it("creates user", () => { users.push({ id: 1 }); });
        it("finds user", () => { expect(users[0].id).toBe(1); });
      `,
      filename: 'OrderDependent.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'users' }
      }]
    },

    // Async operations without proper cleanup
    {
      code: 'let timer; it("test", () => { timer = setTimeout(() => {}, 1000); });',
      filename: 'TimerNoCleanup.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'timer' }
      }]
    },
    {
      code: 'let interval; beforeEach(() => { interval = setInterval(() => {}, 100); });',
      filename: 'IntervalNoCleanup.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { hook: 'beforeEach' }
      }]
    },

    // Multiple violations
    {
      code: `
        let counter = 0;
        let data = {};
        let spy;
        
        beforeEach(() => {
          spy = jest.spyOn(console, "log");
        });
        
        it("test1", () => {
          counter++;
          data.value = 1;
        });
        
        it("test2", () => {
          expect(counter).toBe(1);
          expect(data.value).toBe(1);
        });
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidSharedState', data: { variable: 'counter' } },
        { messageId: 'avoidSharedState', data: { variable: 'data' } },
        { messageId: 'needsCleanup', data: { hook: 'beforeEach' } }
      ]
    },

    // Class instance shared across tests
    {
      code: 'let instance = new MyClass(); it("test", () => { instance.method(); });',
      filename: 'ClassInstance.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'instance' }
      }]
    },

    // DOM manipulation without cleanup
    {
      code: 'let element; beforeEach(() => { element = document.createElement("div"); document.body.appendChild(element); });',
      filename: 'DOMNoCleanup.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { hook: 'beforeEach' }
      }]
    },

    // Global state modification
    {
      code: 'let originalFetch; beforeAll(() => { originalFetch = global.fetch; global.fetch = jest.fn(); });',
      filename: 'GlobalModification.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { hook: 'beforeAll' }
      }]
    }
  ]
});