/**
 * @fileoverview Tests for no-element-removal-check rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-element-removal-check');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-element-removal-check', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'expect(element).not.toBeInTheDocument()',
      filename: 'src/app.js'
    },
    {
      code: 'expect(queryByText("Loading")).toBeNull()',
      filename: 'src/component.js'
    },

    // Positive assertions are fine
    {
      code: 'expect(element).toBeInTheDocument()',
      filename: 'Component.test.js'
    },
    {
      code: 'expect(screen.getByText("Hello")).toBeVisible()',
      filename: 'Visibility.test.js'
    },
    {
      code: 'expect(queryByRole("button")).toBeTruthy()',
      filename: 'Button.test.js'
    },

    // Properly wrapped in waitFor
    {
      code: 'async function test() { await waitFor(() => { expect(element).not.toBeInTheDocument() }) }',
      filename: 'Wrapped.test.js'
    },
    {
      code: 'waitFor(() => expect(screen.queryByText("Loading")).not.toBeInTheDocument())',
      filename: 'WaitFor.test.js'
    },
    {
      code: 'async function test() { await waitForElementToBeRemoved(() => screen.queryByText("Loading")) }',
      filename: 'ProperRemoval.test.js'
    },

    // waitForElementToBeRemoved (always valid regardless of timeout)
    {
      code: 'async function test() { await waitForElementToBeRemoved(() => screen.queryByText("Loading"), { timeout: 5000 }) }',
      filename: 'TimeoutOk.test.js'
    },
    {
      code: 'waitForElementToBeRemoved(() => queryByTestId("spinner"))',
      filename: 'NoTimeout.test.js'
    },
    {
      code: 'async function test() { await waitForElementToBeRemoved(() => screen.queryByText("Loading"), { timeout: 100 }) }',
      filename: 'ShortTimeout.test.js'
    },

    // Non-DOM related null checks
    {
      code: 'expect(result).toBeNull()',
      filename: 'Result.test.js'
    },
    {
      code: 'expect(data).toBeUndefined()',
      filename: 'Data.test.js'
    },
    {
      code: 'expect(value).toBeFalsy()',
      filename: 'Value.test.js'
    },

    // Not using query methods
    {
      code: 'expect(getByText("Hello")).toBeNull()',
      filename: 'GetBy.test.js'
    },
    {
      code: 'expect(findByRole("button")).toBeUndefined()',
      filename: 'FindBy.test.js'
    },

    // document.contains with positive check
    {
      code: 'document.contains(element)',
      filename: 'Contains.test.js'
    },
    {
      code: 'expect(document.contains(element)).toBe(true)',
      filename: 'ContainsTrue.test.js'
    },

    // Different patterns that don't match
    {
      code: 'element.not.visible',
      filename: 'Property.test.js'
    },
    {
      code: 'notToBeInTheDocument()',
      filename: 'Function.test.js'
    },

    // Positive toBeDefined checks are fine
    {
      code: 'expect(queryByText("Loading")).toBeDefined()',
      filename: 'PositiveDefined.test.js'
    },
    {
      code: 'expect(element).toBeVisible()',
      filename: 'PositiveVisible.test.js'
    },

    // Direct null checks with non-query methods
    {
      code: 'if (someVariable === null) { /* do something */ }',
      filename: 'NonQueryNull.test.js'
    },
    {
      code: 'const result = getValue() == null',
      filename: 'NonQueryNullCheck.test.js'
    },

    // expect().not.toBeVisible() wrapped in waitFor
    {
      code: 'async function test() { await waitFor(() => expect(element).not.toBeVisible()) }',
      filename: 'WrappedNotVisible.test.js'
    },
    {
      code: 'async function test() { await waitFor(() => { expect(modal).not.toBeVisible(); }) }',
      filename: 'WrappedModalNotVisible.test.js'
    }
  ],

  invalid: [
    // .not.toBeInTheDocument() without waitFor
    {
      code: 'expect(element).not.toBeInTheDocument()',
      filename: 'Element.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(element).not.toBeInTheDocument(); });'
    },
    {
      code: 'expect(screen.queryByText("Loading")).not.toBeInTheDocument()',
      filename: 'Loading.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(screen.queryByText("Loading")).not.toBeInTheDocument(); });'
    },
    {
      code: 'expect(queryByRole("dialog")).not.toBeInTheDocument()',
      filename: 'Dialog.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(queryByRole("dialog")).not.toBeInTheDocument(); });'
    },

    // Query methods with null/undefined/falsy checks
    {
      code: 'expect(queryByText("Loading")).toBeNull()',
      filename: 'QueryNull.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(queryByText("Loading")).toBeNull(); });'
    },
    {
      code: 'expect(screen.queryByRole("alert")).toBeNull()',
      filename: 'AlertNull.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(screen.queryByRole("alert")).toBeNull(); });'
    },
    {
      code: 'expect(queryByTestId("spinner")).toBeUndefined()',
      filename: 'SpinnerUndefined.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(queryByTestId("spinner")).toBeUndefined(); });'
    },
    {
      code: 'expect(queryByLabelText("Email")).toBeFalsy()',
      filename: 'EmailFalsy.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(queryByLabelText("Email")).toBeFalsy(); });'
    },

    // expect().not.toBeDefined() patterns
    {
      code: 'expect(queryByText("Loading")).not.toBeDefined()',
      filename: 'NotDefined.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(queryByText("Loading")).not.toBeDefined(); });'
    },
    {
      code: 'expect(screen.queryByRole("alert")).not.toBeDefined()',
      filename: 'ScreenNotDefined.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(screen.queryByRole("alert")).not.toBeDefined(); });'
    },

    // Direct null checks (no autofix - too complex)
    {
      code: 'if (queryByTestId("element") === null) { /* removed */ }',
      filename: 'DirectNull.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }]
    },
    {
      code: 'const isRemoved = screen.queryByText("Loading") == null',
      filename: 'DirectNullCheck.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }]
    },

    // expect().not.toBeVisible() without waitFor
    {
      code: 'expect(element).not.toBeVisible()',
      filename: 'NotVisible.test.js',
      errors: [{
        messageId: 'avoidNotVisibleWithoutWaitFor'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(element).not.toBeVisible(); });'
    },
    {
      code: 'expect(screen.getByTestId("modal")).not.toBeVisible()',
      filename: 'ModalNotVisible.test.js',
      errors: [{
        messageId: 'avoidNotVisibleWithoutWaitFor'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(screen.getByTestId("modal")).not.toBeVisible(); });'
    },

    // Nested expression (covers while-loop walk to ExpressionStatement in createWaitForFix)
    {
      code: 'void expect(element).not.toBeInTheDocument()',
      filename: 'VoidAssertion.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { void expect(element).not.toBeInTheDocument(); });'
    },

    // !document.contains(element) pattern
    {
      code: '!document.contains(element)',
      filename: 'DocumentContains.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },
    {
      code: 'expect(!document.contains(modal)).toBe(true)',
      filename: 'DocumentContainsExpect.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },
    {
      code: 'if (!document.contains(popup)) { console.log("removed") }',
      filename: 'DocumentContainsIf.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },

    // Multiple violations
    {
      code: `
        expect(element).not.toBeInTheDocument();
        expect(queryByText("Loading")).toBeNull();
        !document.contains(modal);
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidNotInDocument' },
        { messageId: 'useWaitForRemoval' },
        { messageId: 'avoidRemovalCheck' }
      ],
      output: `
        import { waitFor } from '@testing-library/react';
await waitFor(() => { expect(element).not.toBeInTheDocument(); });
        expect(queryByText("Loading")).toBeNull();
        !document.contains(modal);
      `
    },

    // Different test file extensions
    {
      code: 'expect(element).not.toBeInTheDocument()',
      filename: 'Component.spec.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(element).not.toBeInTheDocument(); });'
    },
    {
      code: 'expect(queryByText("Loading")).toBeNull()',
      filename: 'test/loading.test.ts',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(queryByText("Loading")).toBeNull(); });'
    },

    // Nested patterns
    {
      code: 'it("should remove", () => { expect(element).not.toBeInTheDocument() })',
      filename: 'TestCase.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nit("should remove", async () => { await waitFor(() => { expect(element).not.toBeInTheDocument(); }); })'
    },
    {
      code: 'const isRemoved = !document.contains(element)',
      filename: 'Variable.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },

    // Complex query patterns
    {
      code: 'expect(container.querySelector(".modal")).toBeNull()',
      filename: 'QuerySelector.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(container.querySelector(".modal")).toBeNull(); });'
    },
    {
      code: 'expect(queryAllByRole("listitem")).toBeUndefined()',
      filename: 'QueryAll.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(queryAllByRole("listitem")).toBeUndefined(); });'
    },
    {
      code: 'expect(within(container).queryByText("text")).toBeFalsy()',
      filename: 'WithinQuery.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'import { waitFor } from \'@testing-library/react\';\nawait waitFor(() => { expect(within(container).queryByText("text")).toBeFalsy(); });'
    },

    // Coverage: importFixes === null path (incompatible framework — Playwright)
    {
      code: 'import { expect } from \'@playwright/test\';\nexpect(element).not.toBeInTheDocument()',
      filename: 'test.spec.ts',
      errors: [{
        messageId: 'avoidNotInDocument'
      }]
    },

    // Coverage: asyncFixes === null path (inside class getter — cannot be async)
    {
      code: 'class Foo { get bar() { expect(element).not.toBeInTheDocument() } }',
      filename: 'GetterCheck.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }]
    }
  ]
});

// Unit tests for helper functions
describe('no-element-removal-check rule internals', () => {
  it('should export a rule object', () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeDefined();
  });

  it('should have correct meta information', () => {
    expect(rule.meta.type).toBe('problem');
    expect(rule.meta.docs.description).toBe('Avoid checking for element removal as timing can vary');
    expect(rule.meta.docs.category).toBe('Best Practices');
    expect(rule.meta.docs.recommended).toBe(true);
    expect(rule.meta.fixable).toBe('code');
    expect(rule.meta.messages).toHaveProperty('avoidRemovalCheck');
    expect(rule.meta.messages).toHaveProperty('useWaitForRemoval');
    expect(rule.meta.messages).toHaveProperty('avoidNotInDocument');
    expect(rule.meta.messages).toHaveProperty('avoidNotVisibleWithoutWaitFor');
  });

  it('should have correct URL in meta', () => {
    expect(rule.meta.docs.url).toBe('https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-element-removal-check.md');
  });

  it('should have empty schema', () => {
    expect(rule.meta.schema).toEqual([]);
  });

  it('should return empty object for non-test files', () => {
    const context = {
      getFilename: () => 'app.js',
      report: jest.fn()
    };

    const visitor = rule.create(context);
    expect(visitor).toEqual({});
  });

  it('should create proper visitor for test files', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      report: jest.fn(),
      getSourceCode: () => ({
        getText: () => 'code'
      })
    };

    const visitor = rule.create(context);
    expect(visitor).toBeDefined();
    expect(visitor.CallExpression).toBeDefined();
    expect(visitor.UnaryExpression).toBeDefined();
    expect(visitor.BinaryExpression).toBeDefined();
  });

  describe('Edge cases', () => {
    it('should handle CallExpression without callee name', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {},
        arguments: []
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle BinaryExpression with non-query methods', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'BinaryExpression',
        operator: '===',
        left: { type: 'CallExpression', callee: { name: 'getValue' } },
        right: { type: 'Literal', value: null }
      };

      visitor.BinaryExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle BinaryExpression without null literal', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'BinaryExpression',
        operator: '===',
        left: { type: 'Identifier', name: 'a' },
        right: { type: 'Identifier', name: 'b' }
      };

      visitor.BinaryExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should detect query method in BinaryExpression', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'BinaryExpression',
        operator: '===',
        left: {
          type: 'CallExpression',
          callee: { name: 'queryByTestId' }
        },
        right: { type: 'Literal', value: null }
      };

      visitor.BinaryExpression(node);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'useWaitForRemoval'
        })
      );
    });

    it('should handle MemberExpression without property name', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: {}
        },
        arguments: []
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle expect without arguments', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeNull' },
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' },
            arguments: []
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle UnaryExpression without document.contains', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'UnaryExpression',
        operator: '!',
        argument: {
          type: 'Identifier',
          name: 'someVariable'
        }
      };

      visitor.UnaryExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle UnaryExpression with different operator', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'UnaryExpression',
        operator: '~',
        argument: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { name: 'document' },
            property: { name: 'contains' }
          }
        }
      };

      visitor.UnaryExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle UnaryExpression without CallExpression argument', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'UnaryExpression',
        operator: '!',
        argument: {
          type: 'MemberExpression'
        }
      };

      visitor.UnaryExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle document.contains without proper structure', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'UnaryExpression',
        operator: '!',
        argument: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: {},
            property: { name: 'contains' }
          }
        }
      };

      visitor.UnaryExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle not document but similar structure', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'UnaryExpression',
        operator: '!',
        argument: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { name: 'container' },
            property: { name: 'contains' }
          }
        }
      };

      visitor.UnaryExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle Program parent type', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeInTheDocument' },
          object: {
            type: 'MemberExpression',
            property: { name: 'not' }
          }
        },
        parent: { type: 'Program' }
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalled();
    });

    it('should handle query method without starting with query', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeNull' },
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' },
            arguments: [{
              type: 'CallExpression',
              callee: { name: 'findByTestId' }
            }]
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle query method from property', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: (_node) => 'screen.queryByTestId("element")'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeNull' },
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' },
            arguments: [{
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { name: 'screen' },
                property: { name: 'queryByTestId' }
              }
            }]
          }
        },
        parent: { type: 'ExpressionStatement' }
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalled();
    });

    it('should handle timeout with non-numeric value', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: { name: 'waitForElementToBeRemoved' },
        arguments: [
          { type: 'ArrowFunctionExpression' },
          {
            type: 'ObjectExpression',
            properties: [
              {
                key: { name: 'timeout' },
                value: { type: 'Identifier', name: 'TIMEOUT_VALUE' }
              }
            ]
          }
        ]
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should check all parent types for waitFor wrapper', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);

      // Deeply nested structure with waitFor at top
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeInTheDocument' },
          object: {
            type: 'MemberExpression',
            property: { name: 'not' }
          }
        },
        parent: {
          type: 'ExpressionStatement',
          parent: {
            type: 'BlockStatement',
            parent: {
              type: 'ArrowFunctionExpression',
              parent: {
                type: 'CallExpression',
                callee: { name: 'waitFor' }
              }
            }
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should check for waitForElementToBeRemoved wrapper', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);

      // Nested with waitForElementToBeRemoved
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeInTheDocument' },
          object: {
            type: 'MemberExpression',
            property: { name: 'not' }
          }
        },
        parent: {
          type: 'ExpressionStatement',
          parent: {
            type: 'CallExpression',
            callee: { name: 'waitForElementToBeRemoved' }
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle expect object without type MemberExpression', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeInTheDocument' },
          object: {
            type: 'CallExpression'
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle not property missing', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeInTheDocument' },
          object: {
            type: 'MemberExpression',
            property: { name: 'other' }
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle expect object not being CallExpression', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeNull' },
          object: {
            type: 'Identifier'
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle expect callee not being expect', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeNull' },
          object: {
            type: 'CallExpression',
            callee: { name: 'assert' }
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle argument not being CallExpression', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeNull' },
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' },
            arguments: [{
              type: 'Identifier'
            }]
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle properties without key.name', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: { name: 'waitForElementToBeRemoved' },
        arguments: [
          { type: 'ArrowFunctionExpression' },
          {
            type: 'ObjectExpression',
            properties: [
              { key: {}, value: { value: 500 } }
            ]
          }
        ]
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle enhanced screen.queryBy detection', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeNull' },
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' },
            arguments: [{
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { name: 'screen' },
                property: { name: 'queryByTestId' }
              }
            }]
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'useWaitForRemoval'
        })
      );
    });

    it('should handle .not.toBeDefined() pattern', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeDefined' },
          object: {
            type: 'MemberExpression',
            property: { name: 'not' },
            object: {
              type: 'CallExpression',
              callee: { name: 'expect' },
              arguments: [{
                type: 'CallExpression',
                callee: { name: 'queryByText' }
              }]
            }
          }
        }
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'useWaitForRemoval'
        })
      );
    });

    it('should handle .not.toBeVisible() pattern', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'toBeVisible' },
          object: {
            type: 'MemberExpression',
            property: { name: 'not' }
          }
        },
        parent: { type: 'ExpressionStatement' }
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'avoidNotVisibleWithoutWaitFor'
        })
      );
    });
  });
});