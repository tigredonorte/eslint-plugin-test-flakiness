/**
 * @fileoverview Tests for no-unconditional-wait rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-unconditional-wait');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-unconditional-wait', rule, {
  valid: [
    // Test configuration options - maxTimeout allows timeouts within limit
    {
      code: 'setTimeout(() => {}, 500);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000, allowedMethods: ['setTimeout'] }]  // Allow setTimeout within limit
    },
    {
      code: 'setTimeout(() => {}, 1500);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 2000, allowedMethods: ['setTimeout'] }]  // Allow setTimeout within limit
    },

    // Test configuration options - allowInSetup (with high maxTimeout to allow the timeouts)
    {
      code: `
        beforeEach(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
        });
      `,
      filename: 'Component.test.js',
      options: [{ allowInSetup: true, maxTimeout: 10000 }]
    },
    {
      code: `
        beforeAll(() => {
          setTimeout(() => {}, 3000);
        });
      `,
      filename: 'Component.test.js',
      options: [{ allowInSetup: true, maxTimeout: 10000 }]
    },
    {
      code: `
        afterEach(() => {
          cy.wait(5000);
        });
      `,
      filename: 'cypress/e2e/test.cy.js',
      options: [{ allowInSetup: true, maxTimeout: 10000 }]
    },
    {
      code: `
        afterAll(async () => {
          await browser.pause(2000);
        });
      `,
      filename: 'wdio/test.spec.js',
      options: [{ allowInSetup: true, maxTimeout: 10000 }]
    },

    // Test configuration options - allowedMethods
    {
      code: 'await debounceWait(500);',
      filename: 'Component.test.js',
      options: [{ allowedMethods: ['debounceWait'] }]
    },
    {
      code: 'await customTimeout(2000);',
      filename: 'Component.test.js',
      options: [{ allowedMethods: ['customTimeout'] }]
    },
    {
      code: 'page.waitForTimeout(3000);',
      filename: 'playwright/test.spec.js',
      options: [{ allowedMethods: ['waitForTimeout'] }]
    },
    {
      code: 'cy.wait(2000);',
      filename: 'cypress/e2e/test.cy.js',
      options: [{ allowedMethods: ['wait'] }]
    },

    // Combined options
    {
      code: `
        beforeEach(() => {
          setTimeout(() => {}, 900);
        });
      `,
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000, allowInSetup: true }]
    },
    {
      code: 'await sleep(800);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000, allowedMethods: ['sleep'] }]
    },

    // Edge cases - timeout at exactly maxTimeout
    {
      code: 'setTimeout(() => {}, 1000);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000, allowedMethods: ['setTimeout'] }]  // Allow setTimeout within limit
    },

    // Original valid tests
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
    },

    // setTimeout within Promise constructor with parent checks - removed as it's already covered above

    // Arrow function within Promise constructor - checks parent traversal
    {
      code: `
        const delay = () => new Promise(resolve => {
          setTimeout(resolve, 100);
        });
      `,
      filename: 'ArrowPromise.test.js'
    },

    // page.waitForTimeout within setup hook with allowInSetup and higher maxTimeout
    {
      code: `
        beforeEach(async () => {
          await page.waitForTimeout(2000);
        });
      `,
      filename: 'playwright.test.js',
      options: [{ allowInSetup: true, maxTimeout: 5000 }]
    },

    // browser.pause within setup hook with allowInSetup
    {
      code: `
        beforeAll(async () => {
          await browser.pause(1000);
        });
      `,
      filename: 'webdriver.test.js',
      options: [{ allowInSetup: true }]
    },

    // driver.sleep within setup hook with allowInSetup
    {
      code: `
        afterEach(async () => {
          await driver.sleep(500);
        });
      `,
      filename: 'selenium.test.js',
      options: [{ allowInSetup: true }]
    }
  ],

  invalid: [
    // Test configuration options - maxTimeout violations
    {
      code: 'setTimeout(() => {}, 1001);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 1001, maxTimeout: 1000 }
      }]
    },
    {
      code: 'cy.wait(2000);',
      filename: 'cypress/e2e/test.cy.js',
      options: [{ maxTimeout: 1500 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 2000, maxTimeout: 1500 }
      }]
    },
    {
      code: 'await new Promise(resolve => setTimeout(resolve, 3000));',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 2000 }],
      errors: [
        {
          messageId: 'exceedsMaxTimeout',
          data: { timeout: 3000, maxTimeout: 2000 }
        },
        {
          messageId: 'exceedsMaxTimeout',
          data: { timeout: 3000, maxTimeout: 2000 }
        }
      ]
    },
    {
      code: 'await page.waitForTimeout(5000);',
      filename: 'playwright/test.spec.js',
      options: [{ maxTimeout: 3000 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 5000, maxTimeout: 3000 }
      }]
    },
    {
      code: 'await browser.pause(2500);',
      filename: 'wdio/test.spec.js',
      options: [{ maxTimeout: 2000 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 2500, maxTimeout: 2000 }
      }]
    },
    {
      code: 'await driver.sleep(1500);',
      filename: 'selenium/test.spec.js',
      options: [{ maxTimeout: 1000 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 1500, maxTimeout: 1000 }
      }]
    },
    {
      code: 'await sleep(2000);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1500 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 2000, maxTimeout: 1500 }
      }]
    },
    {
      code: 'Thread.sleep(1200);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 1200, maxTimeout: 1000 }
      }]
    },
    {
      code: 'setInterval(() => {}, 1100);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000 }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 1100, maxTimeout: 1000 }
      }]
    },

    // Test configuration options - allowInSetup: false
    {
      code: `
        beforeEach(() => {
          setTimeout(() => {}, 500);
        });
      `,
      filename: 'Component.test.js',
      options: [{ allowInSetup: false }],
      errors: [{
        messageId: 'useWaitFor'
      }]
    },
    {
      code: `
        beforeAll(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        });
      `,
      filename: 'Component.test.js',
      options: [{ allowInSetup: false }],
      errors: [{
        messageId: 'useWaitFor'
      }],
      output: `
        beforeAll(async () => {
          await waitFor(() => {
  // TODO: Add assertion or condition
  expect(true).toBe(true);
});
        });
      `
    },
    {
      code: `
        afterEach(() => {
          cy.wait(2000);
        });
      `,
      filename: 'cypress/e2e/test.cy.js',
      options: [{ allowInSetup: false, maxTimeout: 1500 }],  // Add maxTimeout to make it explicit
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 2000, maxTimeout: 1500 }
      }]
    },
    {
      code: `
        afterAll(async () => {
          await page.waitForTimeout(1000);
        });
      `,
      filename: 'playwright/test.spec.js',
      options: [{ allowInSetup: false }],
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: `
        afterAll(async () => {
          await page.waitForSelector('[data-testid="element"]'); // TODO: Replace with actual selector
        });
      `
    },

    // Test configuration options - methods not in allowedMethods
    {
      code: 'await sleep(500);',
      filename: 'Component.test.js',
      options: [{ allowedMethods: ['delay'] }],  // sleep not allowed
      errors: [{
        messageId: 'useWaitFor'
      }]
    },
    {
      code: 'cy.wait(1000);',
      filename: 'cypress/e2e/test.cy.js',
      options: [{ allowedMethods: ['pause'] }],  // wait not allowed
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'cy.wait(\'@apiCall\') // TODO: Replace with actual alias or remove wait;'
    },

    // Test combined options
    {
      code: `
        beforeEach(() => {
          setTimeout(() => {}, 2000);
        });
      `,
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000, allowInSetup: true }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 2000, maxTimeout: 1000 }
      }]
    },
    {
      code: `
        beforeEach(() => {
          setTimeout(() => {}, 500);
        });
      `,
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000, allowInSetup: false }],
      errors: [{
        messageId: 'useWaitFor'
      }]
    },
    {
      code: 'await sleep(1500);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000, allowedMethods: ['delay'] }],
      errors: [{
        messageId: 'exceedsMaxTimeout',
        data: { timeout: 1500, maxTimeout: 1000 }
      }]
    },

    // Test that below maxTimeout still triggers regular errors
    {
      code: 'setTimeout(() => {}, 500);',
      filename: 'Component.test.js',
      options: [{ maxTimeout: 1000 }],
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // Test Promise with only setTimeout in body - special case
    {
      code: `
        await new Promise(resolve => {
          setTimeout(() => doSomething(), 1000);
        });
      `,
      filename: 'OnlySetTimeout.test.js',
      errors: [{
        messageId: 'useWaitFor'
      }]
    },

    // Test fix for page.waitForTimeout with semicolon
    {
      code: 'await page.waitForTimeout(1000);',
      filename: 'playwright.test.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'await page.waitForSelector(\'[data-testid="element"]\'); // TODO: Replace with actual selector'
    },

    // Test fix for browser.pause with semicolon
    {
      code: 'await browser.pause(2000);',
      filename: 'webdriver.test.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'await browser.waitUntil(() => element.isDisplayed()); // TODO: Add condition'
    },

    // Test fix for driver.sleep with semicolon
    {
      code: 'await driver.sleep(1500);',
      filename: 'selenium.test.js',
      errors: [{
        messageId: 'avoidUnconditionalWait'
      }],
      output: 'await driver.wait(until.elementLocated(By.id(\'element\'))); // TODO: Add condition'
    },

    // Original invalid tests
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
      ],
      output: `
        cy.wait('@apiCall') // TODO: Replace with actual alias or remove wait;
        setTimeout(() => {}, 2000);
        await waitFor(() => {
  // TODO: Add assertion or condition
  expect(true).toBe(true);
});
      `
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