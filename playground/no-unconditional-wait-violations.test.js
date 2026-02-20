/**
 * Examples of no-unconditional-wait rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 *
 * Note: ESLint rules are disabled in this file to demonstrate the violations
 */

/* global console, setInterval */

// Mock variables needed for the tests
const waitFor = async (callback) => { await callback(); };
const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const wait = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const By = { id: (id) => id };
const element = { toBeVisible: () => true };

describe('Unconditional Wait Violations', () => {
  // ❌ BAD: Cypress wait with fixed number
  it('should not use cy.wait with number', () => {
    cy.visit('/page');
    cy.wait(500); // Bad: unconditional wait - reduced to avoid no-hard-coded-timeout
    cy.get('.content').should('be.visible');
  });

  // ❌ BAD: waitFor with empty callback
  it('should not use waitFor without assertions', async () => {
    await waitFor(() => {
      // Empty callback - no assertions!
    });

    const screen = { getByText: (text) => ({ textContent: text }) };
    const doneElement = screen.getByText('Done');
    expect(doneElement).toBeDefined();
  });

  // ❌ BAD: waitFor with only console.log
  it('should not use waitFor without real assertions', async () => {
    await waitFor(() => {
      console.log('waiting...');
      // No assertions, just logging
    });
  });

  // ❌ BAD: Playwright waitForTimeout
  it('should not use page.waitForTimeout', async () => {
    await page.goto('/');
    await page.waitForTimeout(3000); // Bad: unconditional wait
    await page.click('#button');
  });

  // ❌ BAD: WebdriverIO browser.pause
  it('should not use browser.pause', async () => {
    const browser = {
      url: () => {},
      pause: () => {},
      click: async () => {}
    };
    browser.url('/page');
    browser.pause(2000); // Bad: unconditional wait
    await browser.click('#button'); // Fixed: added await
  });

  // ❌ BAD: Selenium driver.sleep
  it('should not use driver.sleep', async () => {
    const driver = {
      get: async () => {},
      sleep: async () => {},
      findElement: () => ({ click: async () => {} })
    };
    await driver.get('/page');
    await driver.sleep(1500); // Bad: unconditional wait
    await driver.findElement(By.id('button')).click();
  });

  // ❌ BAD: Generic sleep/delay/wait/pause functions
  it('should not use generic wait functions', async () => {
    await sleep(500); // Bad: unconditional wait - reduced to avoid no-hard-coded-timeout
    await delay(500); // Bad: unconditional wait - reduced to avoid no-hard-coded-timeout
    await wait(500); // Bad: unconditional wait - reduced to avoid no-hard-coded-timeout
    await pause(500); // Bad: unconditional wait - reduced to avoid no-hard-coded-timeout

    expect(true).toBe(true);
  });

  // ❌ BAD: Thread.sleep (Java-style)
  it('should not use Thread.sleep pattern', () => {
    const Thread = { sleep: () => {} };
    Thread.sleep(2000); // Bad: unconditional wait
    expect(element).toBeVisible();
  });

  // ❌ BAD: setTimeout as unconditional wait
  it('should not use setTimeout without condition', (done) => {
    setTimeout(() => {
      // Just waiting, no real condition
      done();
    }, 500); // Bad: unconditional wait - reduced to avoid no-hard-coded-timeout
  });

  // ❌ BAD: setInterval without clear condition
  it('should not use setInterval unconditionally', () => {
    setInterval(() => {
      console.log('polling...');
      // No clear exit condition
    }, 500); // Reduced to avoid no-hard-coded-timeout
  });

  // ❌ BAD: Promise with only setTimeout
  // Fixer: replaces with await waitFor(), adds waitFor import,
  //        AND makes the callback async if not already
  it('should not use Promise with just setTimeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Bad: unconditional wait - reduced
    // This is just an unconditional wait
    const screen = { getByText: (text) => ({ textContent: text }) };
    const loadedElement = screen.getByText('Loaded');
    expect(loadedElement).toBeDefined(); // Fixed: changed to toBeDefined
  });

  // ❌ BAD: frame.waitForTimeout in Playwright
  it('should not use frame.waitForTimeout', async () => {
    const frame = page.mainFrame();
    await frame.waitForTimeout(2000); // Bad: unconditional wait
    await frame.click('#button');
  });

  // ❌ BAD: context.waitForTimeout in Playwright
  it('should not use context.waitForTimeout', async () => {
    const context = { waitForTimeout: async () => {} };
    await context.waitForTimeout(1000); // Bad: unconditional wait
    await page.click('#button');
  });
});