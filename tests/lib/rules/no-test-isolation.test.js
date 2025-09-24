/**
 * @fileoverview Tests for no-test-isolation rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-test-isolation');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

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
      code: 'let component; beforeEach(() => { component = renderApp(); })',
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

    // Test with allowedSharedVariables option
    {
      code: 'let sharedUtils = {}; it("test", () => { sharedUtils.doSomething(); });',
      filename: 'AllowedShared.test.js',
      options: [{ allowedSharedVariables: ['sharedUtils'] }]
    },
    {
      code: 'let testHelper; beforeEach(() => { testHelper = createHelper(); });',
      filename: 'AllowedHelper.test.js',
      options: [{ allowedSharedVariables: ['testHelper'] }]
    },

    // Test with allowSharedSetup option
    {
      code: 'beforeAll(() => { global.testData = {}; });',
      filename: 'SharedSetup.test.js',
      options: [{ allowSharedSetup: true }]
    },
    {
      code: 'beforeEach(() => { window.mockFn = jest.fn(); });',
      filename: 'SharedMock.test.js',
      options: [{ allowSharedSetup: true }]
    },

    // Test with checkGlobalState option disabled
    {
      code: 'it("test", () => { global.testValue = 123; });',
      filename: 'GlobalState.test.js',
      options: [{ checkGlobalState: false }]
    },
    {
      code: 'test("test", () => { window.location = "/new"; });',
      filename: 'WindowState.test.js',
      options: [{ checkGlobalState: false }]
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
    },

    // Variable increment in afterEach is okay
    {
      code: 'let counter; afterEach(() => { counter++; });',
      filename: 'AfterEachIncrement.test.js'
    },

    // Increment describe variable with initialization in beforeEach
    {
      code: `describe("suite", () => {
        let counter;
        beforeEach(() => { counter = 0; });
        it("test", () => { counter++; });
      })`,
      filename: 'CounterWithInit.test.js'
    },

    // Non-meaningful method calls (toString/valueOf) are ignored
    {
      code: 'let obj = {}; it("test", () => { obj.toString(); });',
      filename: 'ToString.test.js'
    },

    // Cleanup hook that is not beforeEach or beforeAll
    {
      code: 'afterAll(() => { global.cleanup = true; })',
      filename: 'AfterAllCleanup.test.js'
    },

    // Increment/decrement operations in hooks should be allowed
    {
      code: 'let counter = 0; beforeEach(() => { counter++; });',
      filename: 'IncrementHook.test.js'
    },

    // Custom hooks (not standard test hooks) should be ignored
    {
      code: 'customHook(() => { global.setup = true; });',
      filename: 'CustomHook.test.js'
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
        it("test", () => { component = renderApp(); });
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

    // Test mutating imported module within test context
    {
      code: `
        import { config } from './config';
        describe('test suite', () => {
          it('mutates imported module', () => {
            config.setting = 'modified';
          });
        });
      `,
      filename: 'ImportedModuleMutation.test.js',
      errors: [{
        messageId: 'avoidModuleMutation'
      }]
    },

    // Test with unknown hook type that returns false in hasCorrespondingCleanup
    {
      code: `
        let state;
        customSetup(() => {
          state = { value: 1 };
        });
        it('test', () => {
          state.value = 2;
        });
      `,
      filename: 'CustomHook.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'state' }
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

    // Multiple violations - shared state and cleanup
    {
      code: 'let counter = 0; let data = {}; let spy; beforeEach(() => { spy = jest.spyOn(console, "log"); }); it("test1", () => { counter++; data.value = 1; });',
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'needsCleanup', data: { hook: 'beforeEach' } },
        { messageId: 'avoidSharedState', data: { variable: 'counter' } },
        { messageId: 'avoidSharedState', data: { variable: 'data' } }
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

    // Global state modification - needs to explicitly disable allowSharedSetup to detect cleanup issues
    {
      code: 'beforeAll(() => { jest.spyOn(console, "log"); });',
      filename: 'SpyModification.test.js',
      errors: [{
        messageId: 'needsCleanup',
        data: { hook: 'beforeAll' }
      }]
    },

    // Global state mutations in tests (checkGlobalState: true by default)
    {
      code: 'it("test", () => { global.testValue = 123; });',
      filename: 'GlobalMutation.test.js',
      errors: [{
        messageId: 'globalStateMutation',
        data: { property: 'global.testValue' }
      }]
    },
    {
      code: 'test("test", () => { window.location = "/new"; });',
      filename: 'WindowMutation.test.js',
      errors: [{
        messageId: 'globalStateMutation',
        data: { property: 'window.location' }
      }]
    },
    {
      code: 'it("test", () => { process.env.NODE_ENV = "test"; });',
      filename: 'ProcessMutation.test.js',
      errors: [{
        messageId: 'globalStateMutation',
        data: { property: 'process.env' }
      }]
    },

    // allowSharedSetup: false - should flag setup hooks with both violations
    {
      code: 'beforeAll(() => { global.testData = {}; });',
      filename: 'NoSharedSetup.test.js',
      options: [{ allowSharedSetup: false }],
      errors: [
        { messageId: 'needsCleanup', data: { hook: 'beforeAll' } },
        { messageId: 'globalStateMutation', data: { property: 'global.testData' } }
      ]
    },

    // Variables that should have been in allowedSharedVariables
    {
      code: 'let helper = {}; it("test", () => { helper.method(); });',
      filename: 'DisallowedShared.test.js',
      options: [{ allowedSharedVariables: ['otherHelper'] }],
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'helper' }
      }]
    },

    // Multiple options combined
    {
      code: 'let shared = {}; it("test", () => { shared.value = 1; global.flag = true; });',
      filename: 'MultipleOptions.test.js',
      options: [{ checkGlobalState: true, allowedSharedVariables: [] }],
      errors: [
        { messageId: 'avoidSharedState', data: { variable: 'shared' } },
        { messageId: 'globalStateMutation', data: { property: 'global.flag' } }
      ]
    },

    // Increment describe variable NOT initialized in beforeEach
    {
      code: `describe("suite", () => {
        let counter;
        it("test", () => { counter++; });
      })`,
      filename: 'CounterNoInit.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'counter' }
      }]
    },

    // Module variable property mutation of imported module
    {
      code: 'import utils from "./utils"; it("test", () => { utils.config = {}; });',
      filename: 'ImportedPropertyMutation.test.js',
      errors: [{
        messageId: 'avoidModuleMutation'
      }]
    },

    // Multiple errors on same line/column for sorting
    {
      code: 'let x = {}; let y = {}; it("test", () => { x.value = 1; y.value = 2; });',
      filename: 'SameLine.test.js',
      errors: [
        { messageId: 'avoidSharedState', data: { variable: 'x' } },
        { messageId: 'avoidSharedState', data: { variable: 'y' } }
      ]
    },

    // Calling meaningful methods on shared objects
    {
      code: 'let service = {}; it("test", () => { service.connect(); });',
      filename: 'ServiceConnect.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'service' }
      }]
    },

    // Detects assignment to shared state in describe block without setup initialization
    {
      code: 'describe("test", () => { let shared; it("test", () => { shared = 1; }); });',
      filename: 'DescribeSharedState.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'shared' }
      }]
    },

    // Multiple errors should be reported and sorted correctly
    {
      code: `
        let x, y;
        it("test1", () => { x = 1; });
        it("test2", () => { y = 2; });
      `,
      filename: 'MultipleSorting.test.js',
      errors: [
        { messageId: 'avoidSharedState', data: { variable: 'x' } },
        { messageId: 'avoidSharedState', data: { variable: 'y' } }
      ]
    },

    // Empty objects should be treated as mutable
    {
      code: `
        const emptyObj = {};
        it("test1", () => { emptyObj.value = 1; });
        it("test2", () => { expect(emptyObj.value).toBe(1); });
      `,
      filename: 'EmptyObjectMutation.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'emptyObj' }
      }]
    },

    // Test case: Non-empty object with literal properties should also be treated as mutable
    {
      code: `
        const nonEmptyObj = { initial: 'value' };
        it("test1", () => { nonEmptyObj.newProp = 'added'; });
        it("test2", () => { expect(nonEmptyObj.newProp).toBe('added'); });
      `,
      filename: 'NonEmptyObjectMutation.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'nonEmptyObj' }
      }]
    },

    // Test case: Array expressions should be treated as mutable
    {
      code: `
        const arr = [1, 2, 3];
        it("test1", () => { arr.push(4); });
        it("test2", () => { expect(arr.length).toBe(4); });
      `,
      filename: 'ArrayMutation.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'arr' }
      }]
    },

    // Test case: Empty array should also be treated as mutable
    {
      code: `
        const emptyArr = [];
        it("test1", () => { emptyArr.push('item'); });
        it("test2", () => { expect(emptyArr[0]).toBe('item'); });
      `,
      filename: 'EmptyArrayMutation.test.js',
      errors: [{
        messageId: 'avoidSharedState',
        data: { variable: 'emptyArr' }
      }]
    }
  ]
});