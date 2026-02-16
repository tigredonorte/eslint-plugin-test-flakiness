/**
 * @fileoverview Tests for no-hard-coded-timeout rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-hard-coded-timeout');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

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
    },
    // Should allow in afterAll when configured
    {
      code: 'afterAll(() => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: true }]
    },
    // Should allow in beforeAll when configured
    {
      code: 'beforeAll(() => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: true }]
    },
    // Should allow in afterEach when configured
    {
      code: 'afterEach(() => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: true }]
    },
    // Should not trigger on Promise with non-setTimeout body
    {
      code: 'async function test() { await new Promise(resolve => { someFunction(resolve); }) }',
      filename: 'test.spec.js'
    },
    // Should not trigger on Promise with arrow function without setTimeout
    {
      code: 'async function test() { await new Promise(resolve => doSomething(resolve)) }',
      filename: 'test.spec.js'
    },
    // Should not trigger when delay is a string (even if numeric)
    {
      code: 'setTimeout(() => {}, "2000")',
      filename: 'test.spec.js'
    },
    // Should not trigger on setInterval in mock context
    {
      code: 'jest.fn().mockImplementation(() => setInterval(() => {}, 1000))',
      filename: 'test.spec.js'
    },
    // Promise with block but no statements
    {
      code: 'async function test() { await new Promise(resolve => { }) }',
      filename: 'test.spec.js'
    },
    // Promise with block and non-setTimeout statement
    {
      code: 'async function test() { await new Promise(resolve => { resolve(); }) }',
      filename: 'test.spec.js'
    },
    // Test in after hook (not afterEach/afterAll)
    {
      code: 'after(() => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: true }]
    },
    // Test in before hook (not beforeEach/beforeAll)
    {
      code: 'before(() => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: true }]
    },
    // Promise with non-arrow function argument (line 145 coverage)
    {
      code: 'async function test() { await new Promise(function(resolve) { doSomething(resolve); }) }',
      filename: 'test.spec.js'
    },
    // Promise with setTimeout but delay below maxTimeout (line 171 coverage)
    {
      code: 'async function test() { await new Promise(resolve => setTimeout(resolve, 500)) }',
      filename: 'test.spec.js',
      options: [{ maxTimeout: 1000 }]
    },
    // Wait helper with delay below maxTimeout (line 217 coverage)
    {
      code: 'async function test() { await wait(500) }',
      filename: 'test.spec.js',
      options: [{ maxTimeout: 1000 }]
    },
    // setTimeout not in setup/teardown (line 239 coverage)
    {
      code: 'it("test", () => { const x = () => { setTimeout(() => {}, 500) }; x(); })',
      filename: 'test.spec.js',
      options: [{ maxTimeout: 1000, allowInSetup: true }]
    },
    // Promise with setTimeout but delay is not a literal
    {
      code: 'async function test() { await new Promise(resolve => setTimeout(resolve, someTimeout)) }',
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
      output: `import { waitFor } from '@testing-library/react';
async function test() { await waitFor(async () => {
  console.log("done")
}, { timeout: 2000 }) }`
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
      output: `import { waitFor } from '@testing-library/react';
async function test() { await new Promise(async resolve => await waitFor(async () => {
  resolve
}, { timeout: 3000 })) }`
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
      output: `import { waitFor } from '@testing-library/react';
async function test() { await waitFor(async () => {
  
}, { timeout: 2000 }) }`
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
      output: `import { waitFor } from '@testing-library/react';
async function test() { await waitFor(async () => {
  
}, { timeout: 100 }) }`
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
      output: `import { waitFor } from '@testing-library/react';
beforeEach(async () => { await waitFor(async () => {
  
}, { timeout: 2000 }) })`
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
        { messageId: 'avoidHardTimeoutCypress', data: { timeout: 2000 } },
        { messageId: 'avoidPromiseTimeoutCypress' },
        { messageId: 'avoidHardTimeoutCypress', data: { timeout: 3000 } },
        { messageId: 'avoidCypressWait' }
      ]
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
      output: `import { waitFor } from '@testing-library/react';
async function test() {
        setTimeout(async () => {
          await waitFor(async () => {
  
}, { timeout: 2000 });
        }, 1000);
      }`
    },
    // Promise with block statement body containing setTimeout
    {
      code: 'async function test() { await new Promise(resolve => { setTimeout(resolve, 2000); }) }',
      filename: 'test.spec.js',
      errors: [
        { messageId: 'avoidPromiseTimeout' },
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } }
      ],
      output: `import { waitFor } from '@testing-library/react';
async function test() { await new Promise(async resolve => { await waitFor(async () => {
  resolve
}, { timeout: 2000 }); }) }`
    },
    // Arrow function with expression body in setTimeout
    {
      code: 'async function test() { setTimeout(() => console.log("test"), 2000) }',
      filename: 'test.spec.js',
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } }
      ],
      output: `import { waitFor } from '@testing-library/react';
async function test() { await waitFor(async () => console.log("test"), { timeout: 2000 }) }`
    },
    // setTimeout with non-function first argument
    {
      code: 'async function test() { setTimeout(myCallback, 2000) }',
      filename: 'test.spec.js',
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } }
      ],
      output: `import { waitFor } from '@testing-library/react';
async function test() { await waitFor(async () => {
  myCallback
}, { timeout: 2000 }) }`
    },
    // Test isInMockContext edge case - setInterval in non-mock context
    {
      code: 'window.setInterval(() => {}, 1000)',
      filename: 'test.spec.js',
      errors: [
        { messageId: 'avoidSetInterval' }
      ]
    },
    // Test in afterAll hook with allowInSetup false
    {
      code: 'afterAll(async () => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: false }],
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } }
      ],
      output: `import { waitFor } from '@testing-library/react';
afterAll(async () => { await waitFor(async () => {
  
}, { timeout: 2000 }) })`
    },
    // Test in beforeAll hook with allowInSetup false
    {
      code: 'beforeAll(async () => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: false }],
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } }
      ],
      output: `import { waitFor } from '@testing-library/react';
beforeAll(async () => { await waitFor(async () => {
  
}, { timeout: 2000 }) })`
    },
    // Test in afterEach hook with allowInSetup false
    {
      code: 'afterEach(async () => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: false }],
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } }
      ],
      output: `import { waitFor } from '@testing-library/react';
afterEach(async () => { await waitFor(async () => {
  
}, { timeout: 2000 }) })`
    },
    // Test setTimeout outside setup with allowInSetup true (should still error - line 239 coverage)
    {
      code: 'it("test", () => { setTimeout(() => {}, 2000) })',
      filename: 'test.spec.js',
      options: [{ allowInSetup: true }],
      errors: [
        { messageId: 'avoidHardTimeout', data: { timeout: 2000 } }
      ],
      output: `import { waitFor } from '@testing-library/react';
it("test", async () => { await waitFor(async () => {
  
}, { timeout: 2000 }) })`
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
      getPhysicalFilename: () => 'app.js',
      filename: 'app.js',
      report: jest.fn()
    };

    const visitor = rule.create(context);
    expect(visitor).toEqual({});
  });

  it('should create proper visitor for test files', () => {
    const context = {
      options: [],
      getFilename: () => 'test.spec.js',
      getPhysicalFilename: () => 'test.spec.js',
      filename: 'test.spec.js',
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
        getPhysicalFilename: () => 'test.spec.js',
        filename: 'test.spec.js',
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
        getPhysicalFilename: () => 'test.spec.js',
        filename: 'test.spec.js',
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
        getPhysicalFilename: () => 'test.cy.js',
        filename: 'test.cy.js',
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