/**
 * @fileoverview Tests for no-unconditional-wait rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-unconditional-wait');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-unconditional-wait', rule, {
  valid: [
    // Non-test files should pass
    {
      code: `
        cy.wait(5000);
        setTimeout(() => {}, 1000);
      `,
      filename: 'src/utils.js'
    },

    // Cypress wait with alias
    {
      code: 'cy.wait(\'@apiCall\');',
      filename: 'cypress/e2e/test.cy.js'
    },

    // Cypress wait with array of aliases
    {
      code: 'cy.wait([\'@api1\', \'@api2\']);',
      filename: 'cypress/e2e/test.cy.js'
    },

    // waitFor with proper assertion
    {
      code: `
        await waitFor(() => {
          expect(screen.getByText('Loaded')).toBeInTheDocument();
        });
      `,
      filename: 'Component.test.js'
    },

    // waitFor with return statement
    {
      code: `
        await waitFor(() => {
          return screen.getByText('Loaded');
        });
      `,
      filename: 'Component.test.js'
    },

    // page.waitForSelector in Playwright
    {
      code: 'await page.waitForSelector(\'.loaded\');',
      filename: 'playwright/test.spec.js'
    },

    // page.waitForLoadState in Playwright
    {
      code: 'await page.waitForLoadState(\'networkidle\');',
      filename: 'playwright/test.spec.js'
    },

    // setTimeout in mock context
    {
      code: `
        jest.fn(() => {
          setTimeout(() => {}, 1000);
        });
      `,
      filename: 'Component.test.js'
    },

    // setInterval with condition check
    {
      code: `
        const interval = setInterval(() => {
          if (condition) {
            clearInterval(interval);
          }
        }, 100);
      `,
      filename: 'utils.test.js'
    },

    // Promise with resolve condition
    {
      code: `
        await new Promise(resolve => {
          const check = () => {
            if (element.value) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
      `,
      filename: 'Component.test.js'
    },

    // Cypress wait with string (not a number)
    {
      code: 'cy.wait(\'@route\');',
      filename: 'cypress/e2e/test.cy.js'
    },

    // Not a wait function
    {
      code: 'wait.for.something();',
      filename: 'Component.test.js'
    }
  ],

  invalid: [
    // Cypress wait with numeric delay
    {
      code: 'cy.wait(5000);',
      filename: 'cypress/e2e/test.cy.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'cy.wait(\'@apiCall\') // TODO: Replace with actual alias or remove wait;'
    },

    // Cypress wait with small delay
    {
      code: 'cy.wait(100);',
      filename: 'cypress/e2e/test.cy.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'cy.wait(\'@apiCall\') // TODO: Replace with actual alias or remove wait;'
    },

    // setTimeout with fixed delay
    {
      code: 'setTimeout(() => {}, 1000);',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // setTimeout with callback
    {
      code: 'setTimeout(callback, 2000);',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // setInterval without clear condition
    {
      code: 'setInterval(() => { console.log(\'checking\'); }, 500);',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useDataTestId'
      }]
    },

    // Promise with only setTimeout
    {
      code: 'await new Promise(resolve => setTimeout(resolve, 1000));',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }],
      output: `await waitFor(() => {
  // TODO: Add assertion or condition
  expect(true).toBe(true);
});`
    },

    // Promise with inline setTimeout
    {
      code: 'await new Promise(r => setTimeout(r, 500));',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }],
      output: `await waitFor(() => {
  // TODO: Add assertion or condition
  expect(true).toBe(true);
});`
    },

    // waitFor with empty callback
    {
      code: 'await waitFor(() => {});',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // waitFor with only console.log
    {
      code: `
        await waitFor(() => {
          console.log('waiting');
        });
      `,
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // page.waitForTimeout in Playwright
    {
      code: 'await page.waitForTimeout(3000);',
      filename: 'playwright/test.spec.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'await page.waitForSelector(\'[data-testid="element"]\'); // TODO: Replace with actual selector'
    },

    // browser.pause in WebdriverIO
    {
      code: 'await browser.pause(2000);',
      filename: 'wdio/test.spec.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'await browser.waitUntil(() => element.isDisplayed()); // TODO: Add condition'
    },

    // driver.sleep in Selenium
    {
      code: 'await driver.sleep(1000);',
      filename: 'selenium/test.spec.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'await driver.wait(until.elementLocated(By.id(\'element\'))); // TODO: Add condition'
    },

    // Thread.sleep in various forms
    {
      code: 'Thread.sleep(500);',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }]
    },

    // delay function call
    {
      code: 'await delay(1000);',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // sleep function call
    {
      code: 'await sleep(2000);',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // wait function with numeric argument
    {
      code: 'await wait(500);',
      filename: 'Component.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // Multiple violations in same test
    {
      code: `
        cy.wait(1000);
        setTimeout(() => {}, 2000);
        await new Promise(r => setTimeout(r, 500));
      `,
      filename: 'cypress/e2e/test.cy.js',
      errors: [
        { messageId: 'avoidUnconditionalWait' },
        { messageId: 'useWaitFor' },
        { messageId: 'useWaitFor' }
      ]
    },

    // Nested setTimeout
    {
      code: `
        setTimeout(() => {
          setTimeout(() => {
            done();
          }, 100);
        }, 200);
      `,
      filename: 'Component.test.js',
      errors: [
        { messageId: 'useWaitFor' },
        { messageId: 'useWaitFor' }
      ]
    }
  ]
});