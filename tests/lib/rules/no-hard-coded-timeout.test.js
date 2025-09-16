/**
 * @fileoverview Tests for no-hard-coded-timeout rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-hard-coded-timeout');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  }
});

ruleTester.run('no-hard-coded-timeout', rule, {
  valid: [
    // Should not trigger on non-test files
    {
      code: 'setTimeout(() => {}, 5000)',
      filename: 'app.js'
    },
    // Should not trigger on small timeouts (< maxTimeout)
    {
      code: 'setTimeout(() => {}, 500)',
      filename: 'test.spec.js',
      options: [{ maxTimeout: 1000 }]
    },
    // Should not trigger on variable delays
    {
      code: 'const delay = 1000; setTimeout(() => {}, delay)',
      filename: 'test.spec.js'
    },
    // Should not trigger on mock contexts
    {
      code: 'jest.setTimeout(5000)',
      filename: 'test.spec.js'
    },
    {
      code: 'vi.setTimeout(5000)',
      filename: 'test.spec.js'
    },
    // Should allow in setup when configured
    {
      code: 'beforeEach(() => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: true }]
    },
    // Should not trigger on aliases without numbers
    {
      code: 'cy.wait("@apiCall")',
      filename: 'test.cy.js'
    },
    // Should not trigger on non-numeric arguments
    {
      code: 'setTimeout(() => {}, process.env.TIMEOUT)',
      filename: 'test.spec.js'
    }
  ],

  invalid: [
    // Basic setTimeout violation
    {
      code: 'async function test() { setTimeout(() => { console.log("done") }, 2000) }',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 2000 }
        }
      ],
      output: 'async function test() { await waitFor(async () => {\n  console.log("done")\n}, { timeout: 2000 }) }'
    },
    // setInterval violation
    {
      code: 'setInterval(() => {}, 1000)',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidSetInterval'
        }
      ]
    },
    // Promise-based timeout
    {
      code: 'async function test() { await new Promise(resolve => setTimeout(resolve, 3000)) }',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidPromiseTimeout'
        },
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 3000 }
        }
      ],
      output: 'async function test() { await waitFor(() => expect(true).toBe(true), { timeout: 3000 }) }'
    },
    // Cypress wait with number
    {
      code: 'cy.wait(5000)',
      filename: 'test.cy.js',
      errors: [
        {
          messageId: 'avoidCypressWait'
        }
      ]
    },
    // Wait helper functions
    {
      code: 'async function test() { await wait(2000) }',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 2000 }
        }
      ]
    },
    {
      code: 'async function test() { await delay(1500) }',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 1500 }
        }
      ]
    },
    {
      code: 'async function test() { await sleep(3000) }',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 3000 }
        }
      ]
    },
    {
      code: 'async function test() { await pause(2500) }',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 2500 }
        }
      ]
    },
    // Global setTimeout
    {
      code: 'async function test() { window.setTimeout(() => {}, 2000) }',
      filename: 'test.spec.js',
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 2000 }
        }
      ],
      output: 'async function test() { await waitFor(async () => {\n  \n}, { timeout: 2000 }) }'
    },
    // Custom maxTimeout setting
    {
      code: 'async function test() { setTimeout(() => {}, 100) }',
      filename: 'test.spec.js',
      options: [{ maxTimeout: 50 }],
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 100 }
        }
      ],
      output: 'async function test() { await waitFor(async () => {\n  \n}, { timeout: 100 }) }'
    },
    // Should report in setup when not allowed
    {
      code: 'beforeEach(async () => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: false }],
      errors: [
        {
          messageId: 'avoidHardTimeout',
          data: { timeout: 2000 }
        }
      ],
      output: 'beforeEach(async () => { await waitFor(async () => {\n  \n}, { timeout: 2000 }) })'
    },
    // Multiple violations
    {
      code: `
        it('test', async () => {
          setTimeout(() => {}, 2000);
          await new Promise(r => setTimeout(r, 3000));
          cy.wait(4000);
        })
      `,
      filename: 'test.spec.js',
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } },
        { messageId: 'avoidPromiseTimeout' },
        { messageId: 'avoidHardTimeout', data: { timeout: 3000 } },
        { messageId: 'avoidCypressWait' }
      ],
      output: '\n        it(\'test\', async () => {\n          await waitFor(async () => {\n  \n}, { timeout: 2000 });\n          await waitFor(() => expect(true).toBe(true), { timeout: 3000 });\n          cy.wait(4000);\n        })\n      '
    },
    // Nested setTimeout
    {
      code: `async function test() {
        setTimeout(() => {
          setTimeout(() => {}, 2000);
        }, 1000);
      }`,
      filename: 'test.spec.js',
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } },
        { messageId: 'avoidHardTimeout', data: { timeout: 1000 } }
      ],
      output: `async function test() {
        await waitFor(async () => {
  setTimeout(() => {}, 2000);
}, { timeout: 1000 });
      }`
    }
  ]
});

// Unit tests for helper functions
describe('no-hard-coded-timeout rule internals', () => {
  it('should export a rule object', () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeDefined();
  });

  it('should have correct meta information', () => {
    expect(rule.meta.type).toBe('problem');
    expect(rule.meta.docs.description).toBe('Disallow hard-coded timeouts in tests');
    expect(rule.meta.fixable).toBe('code');
    expect(rule.meta.messages).toHaveProperty('avoidHardTimeout');
    expect(rule.meta.messages).toHaveProperty('avoidSetInterval');
    expect(rule.meta.messages).toHaveProperty('avoidPromiseTimeout');
    expect(rule.meta.messages).toHaveProperty('avoidCypressWait');
  });

  it('should have schema with correct options', () => {
    expect(rule.meta.schema).toHaveLength(1);
    expect(rule.meta.schema[0].type).toBe('object');
    expect(rule.meta.schema[0].properties).toHaveProperty('maxTimeout');
    expect(rule.meta.schema[0].properties.maxTimeout.default).toBe(1000);
    expect(rule.meta.schema[0].properties).toHaveProperty('allowInSetup');
    expect(rule.meta.schema[0].properties.allowInSetup.default).toBe(false);
  });

  it('should return empty object for non-test files', () => {
    const context = {
      options: [],
      getFilename: () => 'app.js',
      report: jest.fn()
    };

    const visitor = rule.create(context);
    expect(visitor).toEqual({});
  });

  it('should create proper visitor for test files', () => {
    const context = {
      options: [],
      getFilename: () => 'test.spec.js',
      report: jest.fn(),
      getSourceCode: () => ({
        getText: () => 'code'
      })
    };

    const visitor = rule.create(context);
    expect(visitor).toBeDefined();
    expect(visitor.CallExpression).toBeDefined();
    expect(visitor.NewExpression).toBeDefined();
  });

  describe('Edge cases', () => {
    it('should handle setTimeout without delay argument', () => {
      const context = {
        options: [],
        getFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '() => {}'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: { name: 'setTimeout' },
        arguments: [{ type: 'ArrowFunctionExpression' }],
        parent: null
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle Promise without setTimeout', () => {
      const context = {
        options: [],
        getFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'NewExpression',
        callee: { name: 'Promise' },
        arguments: [
          {
            type: 'ArrowFunctionExpression',
            body: { type: 'BlockStatement' }
          }
        ]
      };

      visitor.NewExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle Cypress wait with string alias', () => {
      const context = {
        options: [],
        getFilename: () => 'test.cy.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'cy.wait'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'cy' },
          property: { name: 'wait' }
        },
        arguments: [{ type: 'Literal', value: '@apiCall' }]
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });
  });
});