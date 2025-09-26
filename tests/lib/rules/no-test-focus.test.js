/**
 * @fileoverview Tests for no-test-focus rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-test-focus');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-test-focus', rule, {
  valid: [
    // Normal test cases without focus/skip
    {
      code: 'test(\'should work\', () => {});',
      filename: 'test.spec.js'
    },
    {
      code: 'it(\'should work\', () => {});',
      filename: 'test.spec.js'
    },
    {
      code: 'describe(\'suite\', () => {});',
      filename: 'test.spec.js'
    },
    // Non-test file should not trigger
    {
      code: 'test.only(\'should work\', () => {});',
      filename: 'index.js'
    },
    // Allow skip when configured
    {
      code: 'test.skip(\'should work\', () => {});',
      filename: 'test.spec.js',
      options: [{ allowSkip: true }]
    },
    {
      code: 'describe.skip(\'suite\', () => {});',
      filename: 'test.spec.js',
      options: [{ allowSkip: true }]
    },
    {
      code: 'xit(\'should work\', () => {});',
      filename: 'test.spec.js',
      options: [{ allowSkip: true }]
    },
    // Allow only when configured
    {
      code: 'test.only(\'should work\', () => {});',
      filename: 'test.spec.js',
      options: [{ allowOnly: true }]
    },
    {
      code: 'describe.only(\'suite\', () => {});',
      filename: 'test.spec.js',
      options: [{ allowOnly: true }]
    },
    {
      code: 'fit(\'should work\', () => {});',
      filename: 'test.spec.js',
      options: [{ allowOnly: true }]
    },
    // Normal function calls that happen to have similar names
    {
      code: 'myTest.only(\'should work\', () => {});',
      filename: 'test.spec.js'
    },
    {
      code: 'const fit = () => {}; fit();',
      filename: 'test.spec.js'
    },
    // Custom patterns that should NOT trigger
    {
      code: 'regularTest("should work", () => {});',
      options: [{ customFocusPatterns: ['testFocus'] }],
      filename: 'test.spec.js'
    },
    {
      code: 'normalTest("should work", () => {});',
      options: [{ customSkipPatterns: ['skipThisTest'] }],
      filename: 'test.spec.js'
    }
  ],

  invalid: [
    // test.only
    {
      code: 'test.only(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'test' } }],
      output: 'test(\'should work\', () => {});'
    },
    // it.only
    {
      code: 'it.only(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'it' } }],
      output: 'it(\'should work\', () => {});'
    },
    // describe.only
    {
      code: 'describe.only(\'suite\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'describe' } }],
      output: 'describe(\'suite\', () => {});'
    },
    // test.skip
    {
      code: 'test.skip(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestSkip', data: { method: 'test' } }],
      output: 'test(\'should work\', () => {});'
    },
    // it.skip
    {
      code: 'it.skip(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestSkip', data: { method: 'it' } }],
      output: 'it(\'should work\', () => {});'
    },
    // describe.skip
    {
      code: 'describe.skip(\'suite\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestSkip', data: { method: 'describe' } }],
      output: 'describe(\'suite\', () => {});'
    },
    // test.todo
    {
      code: 'test.todo(\'should implement later\');',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestSkip', data: { method: 'test' } }],
      output: 'test(\'should implement later\');'
    },
    // fit (focused it)
    {
      code: 'fit(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'fit' } }],
      output: 'it(\'should work\', () => {});'
    },
    // fdescribe (focused describe)
    {
      code: 'fdescribe(\'suite\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'fdescribe' } }],
      output: 'describe(\'suite\', () => {});'
    },
    // ftest (focused test)
    {
      code: 'ftest(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'ftest' } }],
      output: 'test(\'should work\', () => {});'
    },
    // xit (skipped it)
    {
      code: 'xit(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noSkippedTest', data: { method: 'xit' } }],
      output: 'it(\'should work\', () => {});'
    },
    // xdescribe (skipped describe)
    {
      code: 'xdescribe(\'suite\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noSkippedTest', data: { method: 'xdescribe' } }],
      output: 'describe(\'suite\', () => {});'
    },
    // xtest (skipped test)
    {
      code: 'xtest(\'should work\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noSkippedTest', data: { method: 'xtest' } }],
      output: 'test(\'should work\', () => {});'
    },
    // Multiple violations
    {
      code: `
        describe.only('suite', () => {
          test.skip('test 1', () => {});
          fit('test 2', () => {});
          xit('test 3', () => {});
        });
      `,
      filename: 'test.spec.js',
      errors: [
        { messageId: 'noTestOnly', data: { method: 'describe' } },
        { messageId: 'noTestSkip', data: { method: 'test' } },
        { messageId: 'noFocusedTest', data: { method: 'fit' } },
        { messageId: 'noSkippedTest', data: { method: 'xit' } }
      ],
      output: `
        describe('suite', () => {
          test('test 1', () => {});
          it('test 2', () => {});
          it('test 3', () => {});
        });
      `
    },
    // Custom focus patterns
    {
      code: 'myFocusTest(\'should work\', () => {});',
      filename: 'test.spec.js',
      options: [{ customFocusPatterns: ['myFocusTest'] }],
      errors: [{ messageId: 'noFocusedTest', data: { method: 'myFocusTest' } }]
    },
    // Custom skip patterns
    {
      code: 'mySkipTest(\'should work\', () => {});',
      filename: 'test.spec.js',
      options: [{ customSkipPatterns: ['mySkipTest'] }],
      errors: [{ messageId: 'noSkippedTest', data: { method: 'mySkipTest' } }]
    },
    // context.only (Mocha)
    {
      code: 'context.only(\'when something\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'context' } }],
      output: 'context(\'when something\', () => {});'
    },
    // suite.skip (Mocha)
    {
      code: 'suite.skip(\'suite\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestSkip', data: { method: 'suite' } }],
      output: 'suite(\'suite\', () => {});'
    },
    // Bracket notation tests
    {
      code: 'test["only"](\'focused test\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'test' } }],
      output: 'test(\'focused test\', () => {});'
    },
    {
      code: 'describe[\'skip\'](\'skipped suite\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestSkip', data: { method: 'describe' } }],
      output: 'describe(\'skipped suite\', () => {});'
    },
    {
      code: 'it[`only`]("focused test with template", () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'it' } }],
      output: 'it("focused test with template", () => {});'
    },
    {
      code: 'test[\'todo\'](\'todo test\', () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestSkip', data: { method: 'test' } }],
      output: 'test(\'todo test\', () => {});'
    },
    // Template literal tests
    {
      code: 'fit`test description`',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'fit' } }],
      output: 'it`test description`'
    },
    {
      code: 'xdescribe`suite description`',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noSkippedTest', data: { method: 'xdescribe' } }],
      output: 'describe`suite description`'
    },
    {
      code: 'test.only`tagged template test`',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'test' } }],
      output: 'test`tagged template test`'
    },
    // Custom patterns with auto-fix
    {
      code: 'testOnly("should work", () => {});',
      options: [{ customFocusPatterns: ['testOnly'] }],
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'testOnly' } }],
      output: 'test("should work", () => {});'
    },
    {
      code: 'describeSkip("should be skipped", () => {});',
      options: [{ customSkipPatterns: ['describeSkip'] }],
      filename: 'test.spec.js',
      errors: [{ messageId: 'noSkippedTest', data: { method: 'describeSkip' } }],
      output: 'describe("should be skipped", () => {});'
    },
    // Wildcard pattern tests
    {
      code: 'focusTest("should work", () => {});',
      options: [{ customFocusPatterns: ['focus*'] }],
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'focusTest' } }]
    },
    {
      code: 'testWithOnly("should work", () => {});',
      options: [{ customFocusPatterns: ['*Only'] }],
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'testWithOnly' } }],
      output: 'testWith("should work", () => {});'
    },
    {
      code: 'anythingSkip("should be skipped", () => {});',
      options: [{ customSkipPatterns: ['*Skip'] }],
      filename: 'test.spec.js',
      errors: [{ messageId: 'noSkippedTest', data: { method: 'anythingSkip' } }],
      output: 'anything("should be skipped", () => {});'
    },
    // Test for already focused methods (fdescribe is already a focused method)
    {
      code: 'fdescribe("should work", () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'fdescribe' } }],
      output: 'describe("should work", () => {});'
    },
    // Test for fit as a focused method
    {
      code: 'fit("should work", () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noFocusedTest', data: { method: 'fit' } }],
      output: 'it("should work", () => {});'
    },
    // Test custom pattern that removes f prefix and matches test method
    {
      code: 'ftest("should work", () => {});',
      filename: 'test.spec.js',
      options: [{ customFocusPatterns: ['ftest'] }],
      errors: [
        { messageId: 'noFocusedTest', data: { method: 'ftest' } },
        { messageId: 'noFocusedTest', data: { method: 'ftest' } }
      ],
      output: 'test("should work", () => {});'
    },
    // Test for lines 146-147: custom pattern with .skip modifier
    {
      code: 'myTest.skip("should work", () => {});',
      filename: 'test.spec.js',
      options: [{ customSkipPatterns: ['myTest.skip'] }],
      errors: [{ messageId: 'noSkippedTest', data: { method: 'myTest.skip' } }],
      output: 'myTest("should work", () => {});'
    },
    // Test for line 155-156: custom pattern with .only modifier in pattern
    {
      code: 'customTest.only("should work", () => {});',
      filename: 'test.spec.js',
      options: [{ customFocusPatterns: ['customTest.only'] }],
      errors: [{ messageId: 'noFocusedTest', data: { method: 'customTest.only' } }],
      output: 'customTest("should work", () => {});'
    },
    // Test for non-identifier property in computed member expression (line 106)
    {
      code: 'window.global[test]["only"]("should work", () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'test' } }],
      output: 'window.global[test]("should work", () => {});'
    },
    // Test for custom pattern with computed property and fix (line 296)
    {
      code: 'myCustomTest["skip"]("should skip", () => {});',
      filename: 'test.spec.js',
      options: [{ customSkipPatterns: ['myCustomTest.skip'] }],
      errors: [{ messageId: 'noSkippedTest', data: { method: 'myCustomTest.skip' } }],
      output: 'myCustomTest("should skip", () => {});'
    },
    // Test nested member expression with fallback (line 118)
    {
      code: 'window[globalVar].test.only("should work", () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'test' } }],
      output: 'window[globalVar].test("should work", () => {});'
    },
    // Test for custom focus pattern with member expression and computed property (lines 255-260)
    {
      code: 'myCustom["only"]("should focus", () => {});',
      filename: 'test.spec.js',
      options: [{ customFocusPatterns: ['myCustom.only'] }],
      errors: [{ messageId: 'noFocusedTest', data: { method: 'myCustom.only' } }],
      output: 'myCustom("should focus", () => {});'
    },
    // Test fallback in getTestMethodName (line 212) - no test method found
    {
      code: 'customFramework.test.only("should work", () => {});',
      filename: 'test.spec.js',
      errors: [{ messageId: 'noTestOnly', data: { method: 'test' } }],
      output: 'customFramework.test("should work", () => {});'
    }
  ]
});

// Additional unit tests for edge cases
describe('no-test-focus edge cases', () => {
  let rule;

  beforeEach(() => {
    rule = require('../../../lib/rules/no-test-focus');
  });

  it('should handle getObjectName with computed MemberExpression', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getTokenBefore: () => ({ range: [0, 1] })
      })
    };

    const visitor = rule.create(context);

    // Test computed property access - test['only']
    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: 'test'
        },
        property: {
          type: 'Literal',
          value: 'only'
        },
        computed: true
      },
      arguments: [{ type: 'Literal', value: 'test name' }]
    };

    visitor.CallExpression(node);

    // Should report because it's test['only']
    expect(context.report).toHaveBeenCalled();
  });

  it('should handle getObjectName returning undefined', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getTokenBefore: () => ({ range: [0, 1] })
      })
    };

    const visitor = rule.create(context);

    // Test with an object that returns undefined from getObjectName
    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'ThisExpression' // This will return undefined from getObjectName
        },
        property: {
          name: 'only'
        },
        computed: false
      },
      arguments: [{ type: 'Literal', value: 'test name' }]
    };

    visitor.CallExpression(node);

    // Should not report because objectName is undefined
    expect(context.report).not.toHaveBeenCalled();
  });

  it('should handle custom pattern fix when modified is a test method', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{ customFocusPatterns: ['fit'] }],
      report: jest.fn(),
      getSourceCode: () => ({})
    };

    const visitor = rule.create(context);

    const node = {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'fit'
      },
      arguments: [{ type: 'Literal', value: 'test name' }]
    };

    visitor.CallExpression(node);

    // Should report with fix
    expect(context.report).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'noFocusedTest',
        fix: expect.any(Function)
      })
    );
  });

  it('should handle custom pattern with .only modifier', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{ customFocusPatterns: ['myTest.only'] }],
      report: jest.fn(),
      getSourceCode: () => ({})
    };

    const visitor = rule.create(context);

    const node = {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'myTest.only'
      },
      arguments: [{ type: 'Literal', value: 'test name' }]
    };

    visitor.CallExpression(node);

    // Should report with fix to remove .only
    expect(context.report).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'noFocusedTest',
        fix: expect.any(Function)
      })
    );
  });

  it('should handle getObjectName with Literal node (line 90)', () => {
    // Access the getObjectName function through the rule's create function
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getTokenBefore: () => ({ range: [0, 1] })
      })
    };

    const visitor = rule.create(context);

    // Create a node with Literal type to test line 90
    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Literal',
          value: 'test'  // This should return 'test' from getObjectName
        },
        property: {
          name: 'only'
        },
        computed: false
      },
      arguments: [{ type: 'Literal', value: 'test name' }]
    };

    visitor.CallExpression(node);

    // Should report for test.only
    expect(context.report).toHaveBeenCalled();
  });

  it('should handle getObjectName with TemplateLiteral (line 95)', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getTokenBefore: () => ({ range: [0, 1] })
      })
    };

    const visitor = rule.create(context);

    // Create a node with TemplateLiteral with no expressions
    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'TemplateLiteral',
          quasis: [{ value: { raw: 'test' } }],
          expressions: []
        },
        property: {
          name: 'only'
        },
        computed: false
      },
      arguments: [{ type: 'Literal', value: 'test name' }]
    };

    visitor.CallExpression(node);

    // Should report for test.only
    expect(context.report).toHaveBeenCalled();
  });

  it('should handle nested MemberExpression with computed property (lines 101-109)', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getTokenBefore: () => ({ range: [0, 1] })
      })
    };

    const visitor = rule.create(context);

    // Create nested MemberExpression with computed properties
    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'MemberExpression',
          object: {
            type: 'MemberExpression',
            object: {
              type: 'Identifier',
              name: 'window'
            },
            property: {
              type: 'Identifier',
              name: 'global'
            },
            computed: false
          },
          property: {
            type: 'Literal',
            value: 'test'
          },
          computed: true  // window.global['test']
        },
        property: {
          name: 'only'
        },
        computed: false
      },
      arguments: [{ type: 'Literal', value: 'test name' }]
    };

    visitor.CallExpression(node);

    // Should report for complex nested member expression ending in .only
    expect(context.report).toHaveBeenCalled();
  });
});