/**
 * @fileoverview Tests for no-promise-race rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-promise-race');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-promise-race', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'Promise.race([promise1, promise2])',
      filename: 'src/app.js'
    },
    {
      code: 'const result = await Promise.race([fetch1, fetch2])',
      filename: 'src/api.js'
    },

    // Promise.all is fine
    {
      code: 'Promise.all([promise1, promise2])',
      filename: 'Promise.test.js'
    },
    {
      code: 'await Promise.all([fetch1, fetch2])',
      filename: 'Fetch.test.js'
    },

    // Promise.allSettled is fine
    {
      code: 'Promise.allSettled([promise1, promise2])',
      filename: 'Settled.test.js'
    },
    {
      code: 'await Promise.allSettled([operation1, operation2])',
      filename: 'Operations.test.js'
    },

    // Other Promise methods
    {
      code: 'Promise.resolve(value)',
      filename: 'Resolve.test.js'
    },
    {
      code: 'Promise.reject(error)',
      filename: 'Reject.test.js'
    },

    // Custom race implementations (not Promise.race)
    {
      code: 'customRace([promise1, promise2])',
      filename: 'Custom.test.js'
    },
    {
      code: 'utils.race([p1, p2])',
      filename: 'Utils.test.js'
    },

    // Using Promise.any (different from race)
    {
      code: 'Promise.any([promise1, promise2])',
      filename: 'Any.test.js'
    },

    // Sequential promises
    {
      code: 'await promise1; await promise2;',
      filename: 'Sequential.test.js'
    },
    {
      code: 'promise1.then(() => promise2)',
      filename: 'Chain.test.js'
    },

    // Timeout patterns without race
    {
      code: 'await waitFor(() => expect(element).toBeVisible(), { timeout: 5000 })',
      filename: 'WaitFor.test.js'
    },
    {
      code: 'await expect(promise).resolves.toBe(value)',
      filename: 'Resolves.test.js'
    },

    // Configuration: allowWithTimeout true - allows timeout patterns
    {
      code: `
        const result = await Promise.race([
          fetchData(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      `,
      filename: 'TimeoutAllowed.test.js',
      options: [{ allowWithTimeout: true }]
    },
    {
      code: 'await Promise.race([apiCall(), timeout(1000)])',
      filename: 'TimeoutFunc.test.js',
      options: [{ allowWithTimeout: true }]
    },

    // Configuration: allowInHelpers true - allows in helper functions
    {
      code: `
        function createTimeoutHelper() {
          return Promise.race([operation(), timeout()]);
        }
      `,
      filename: 'Helper.test.js',
      options: [{ allowInHelpers: true }]
    },
    {
      code: `
        const utilHelper = () => {
          return Promise.race([fetch1(), fetch2()]);
        }
      `,
      filename: 'Util.test.js',
      options: [{ allowInHelpers: true }]
    },
    {
      code: `
        function setupMock() {
          return Promise.race([mock1(), mock2()]);
        }
      `,
      filename: 'Mock.test.js',
      options: [{ allowInHelpers: true }]
    },

    // Test helper function outside test block (line 92)
    {
      code: `
        function helperFunction() {
          return Promise.race([api1(), api2()]);
        }
      `,
      filename: 'HelperOutsideTest.test.js',
      options: [{ allowInHelpers: true }]
    },

    // Test helper function at module level (not in test block) (lines 111-113)
    {
      code: `
        const moduleHelper = () => {
          return Promise.race([fetch1(), fetch2()]);
        };
      `,
      filename: 'ModuleLevel.test.js',
      options: [{ allowInHelpers: true }]
    },

    // Test helper function outside hooks/test blocks (covers line 92)
    {
      code: `
        function utilHelper() {
          return Promise.race([operation1(), operation2()]);
        }
        const value = utilHelper();
      `,
      filename: 'UtilHelper.test.js',
      options: [{ allowInHelpers: true }]
    },

    // Test function at module level (not in test block) - should cover line 92 and 111-113
    {
      code: `
        function regularFunction() {
          return Promise.race([p1(), p2()]);
        }
      `,
      filename: 'RegularFunction.test.js',
      options: [{ allowInHelpers: true }]
    },

    // Test arrow function at module level (not in test block)
    {
      code: `
        const arrowFunc = () => {
          return Promise.race([a(), b()]);
        };
      `,
      filename: 'ArrowFunc.test.js',
      options: [{ allowInHelpers: true }]
    },


    // Test case for Promise.race in a standalone arrow function (not in test block)
    {
      code: `
        const standaloneHelper = () => Promise.race([p1, p2]);
      `,
      filename: 'StandaloneArrow.test.js',
      options: [{ allowInHelpers: true }]
    },

    // Test case for Promise.race in nested function outside test block
    {
      code: `
        function outerHelper() {
          function innerHelper() {
            return Promise.race([a(), b()]);
          }
          return innerHelper();
        }
      `,
      filename: 'NestedHelper.test.js',
      options: [{ allowInHelpers: true }]
    },

  ],

  invalid: [
    // Basic Promise.race usage
    {
      code: 'Promise.race([promise1, promise2])',
      filename: 'Race.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'await Promise.race([fetchData(), timeout(5000)])',
      filename: 'Timeout.test.js',
      errors: [{
        messageId: 'useProperTimeout'
      }]
    },

    // Race with timeout pattern
    {
      code: 'Promise.race([apiCall(), new Promise((_, reject) => setTimeout(reject, 5000))])',
      filename: 'TimeoutRace.test.js',
      errors: [{
        messageId: 'useProperTimeout'
      }]
    },
    {
      code: 'await Promise.race([operation, rejectAfter(3000)])',
      filename: 'RejectAfter.test.js',
      errors: [{
        messageId: 'useProperTimeout'
      }]
    },

    // Variable assignment
    {
      code: 'const result = Promise.race([p1, p2])',
      filename: 'Variable.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'const winner = await Promise.race(promises)',
      filename: 'Winner.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // In test blocks
    {
      code: 'it("should race", async () => { await Promise.race([p1, p2]) })',
      filename: 'TestBlock.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'test("race condition", () => Promise.race([promise1, promise2]))',
      filename: 'TestCase.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Return statement
    {
      code: 'function test() { return Promise.race([operation1, operation2]) }',
      filename: 'Return.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Chained methods
    {
      code: 'Promise.race([p1, p2]).then(result => console.log(result))',
      filename: 'Chain.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'Promise.race([fetch1, fetch2]).catch(handleError)',
      filename: 'Catch.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Multiple promises
    {
      code: 'Promise.race([p1, p2, p3, p4])',
      filename: 'Multiple.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Nested in try-catch
    {
      code: 'try { await Promise.race([api1(), api2()]) } catch (e) { }',
      filename: 'TryCatch.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // With spread operator
    {
      code: 'Promise.race([...promises])',
      filename: 'Spread.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Complex timeout pattern
    {
      code: `
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        await Promise.race([fetchData(), timeoutPromise]);
      `,
      filename: 'ComplexTimeout.test.js',
      errors: [{
        messageId: 'useProperTimeout'
      }]
    },

    // Multiple violations
    {
      code: `
        const result1 = await Promise.race([p1, p2]);
        const result2 = Promise.race([p3, p4]);
        Promise.race([p5, p6]);
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidPromiseRace' },
        { messageId: 'avoidPromiseRace' },
        { messageId: 'avoidPromiseRace' }
      ]
    },

    // Different test file extensions
    {
      code: 'Promise.race([promise1, promise2])',
      filename: 'Race.spec.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'await Promise.race([p1, p2])',
      filename: 'test/race.test.ts',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'Promise.race([promise1, promise2])',
      filename: '__tests__/race.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // In different contexts
    {
      code: 'beforeEach(async () => { await Promise.race([setup1(), setup2()]) })',
      filename: 'Setup.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'afterEach(() => Promise.race([cleanup1(), cleanup2()]))',
      filename: 'Cleanup.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Test helper function defined at module level but not allowed (covers line 92 and 111-113)
    {
      code: `
        function helperFunction() {
          return Promise.race([api1(), api2()]);
        }
      `,
      filename: 'HelperNotAllowed.test.js',
      options: [{ allowInHelpers: false }],
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Test Promise.race at top level without allowInHelpers (covers isInsideTestBlock returning false)
    {
      code: `
        const raceResult = Promise.race([promise1, promise2]);
      `,
      filename: 'TopLevelRace.test.js',
      options: [{ allowInHelpers: false }],
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },


    // With async/await
    {
      code: 'const fastest = await Promise.race([async1(), async2()])',
      filename: 'Async.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // In assertion
    {
      code: 'expect(Promise.race([p1, p2])).resolves.toBe(value)',
      filename: 'Expect.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Array methods
    {
      code: 'Promise.race(promises.map(p => p.timeout(1000)))',
      filename: 'Map.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },
    {
      code: 'Promise.race(operations.filter(op => op.priority === "high"))',
      filename: 'Filter.test.js',
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Configuration: allowWithTimeout false - still errors on timeout patterns
    {
      code: `
        await Promise.race([
          fetchData(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      `,
      filename: 'TimeoutNotAllowed.test.js',
      options: [{ allowWithTimeout: false }],
      errors: [{
        messageId: 'useProperTimeout'
      }]
    },

    // Configuration: allowInHelpers false - errors in helper functions
    {
      code: `
        function createHelper() {
          return Promise.race([operation1(), operation2()]);
        }
      `,
      filename: 'HelperError.test.js',
      options: [{ allowInHelpers: false }],
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Configuration: Promise.race inside test blocks should error even with allowInHelpers
    {
      code: `
        test('some test', async () => {
          await Promise.race([p1(), p2()]);
        });
      `,
      filename: 'TestBlock.test.js',
      options: [{ allowInHelpers: true }],
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    },

    // Configuration: Multiple options together
    {
      code: `
        await Promise.race([
          apiCall(),
          timeout(1000)
        ]);
      `,
      filename: 'MultiOptions.test.js',
      options: [{ allowWithTimeout: false, allowInHelpers: false }],
      errors: [{
        messageId: 'useProperTimeout'
      }]
    },

    // Promise.race inside nested test block (covers lines 111-113)
    {
      code: `
        describe('suite', () => {
          it('test', () => {
            return Promise.race([p1(), p2()]);
          });
        });
      `,
      filename: 'NestedTestBlock.test.js',
      options: [{ allowInHelpers: false }],
      errors: [{
        messageId: 'avoidPromiseRace'
      }]
    }
  ]
});