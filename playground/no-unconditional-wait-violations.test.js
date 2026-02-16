 
/* eslint-disable test-flakiness/no-hard-coded-timeout */
/* eslint-disable no-undef */

/**
 * Examples of no-unconditional-wait rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 *
 * Note: ESLint rules are disabled in this file to demonstrate the violations
 */

describe('Unconditional Wait Violations', () => {
  // ❌ BAD: Cypress wait with fixed number
  it('should not use cy.wait with number', () => {
    cy.visit('/page');
    cy.wait(5000); // Bad: unconditional wait
    cy.get('.content').should('be.visible');
  });

  // ❌ BAD: waitFor with empty callback
  it('should not use waitFor without assertions', async () => {
    await waitFor(() => {
      // Empty callback - no assertions!
    });

    expect(screen.getByText('Done')).toBeInTheDocument();
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
  it('should not use browser.pause', () => {
    browser.url('/page');
    browser.pause(2000); // Bad: unconditional wait
    browser.click('#button');
  });

  // ❌ BAD: Selenium driver.sleep
  it('should not use driver.sleep', async () => {
    await driver.get('/page');
    await driver.sleep(1500); // Bad: unconditional wait
    await driver.findElement(By.id('button')).click();
  });

  // ❌ BAD: Generic sleep/delay/wait/pause functions
  it('should not use generic wait functions', async () => {
    await sleep(2000); // Bad: unconditional wait
    await delay(1500); // Bad: unconditional wait
    await wait(3000); // Bad: unconditional wait
    await pause(1000); // Bad: unconditional wait

    expect(true).toBe(true);
  });

  // ❌ BAD: Thread.sleep (Java-style)
  it('should not use Thread.sleep pattern', () => {
    Thread.sleep(2000); // Bad: unconditional wait
    expect(element).toBeVisible();
  });

  // ❌ BAD: setTimeout as unconditional wait
  it('should not use setTimeout without condition', (done) => {
    setTimeout(() => {
      // Just waiting, no real condition
      done();
    }, 2000); // Bad: unconditional wait
  });

  // ❌ BAD: setInterval without clear condition
  it('should not use setInterval unconditionally', () => {
    setInterval(() => {
      console.log('polling...');
      // No clear exit condition
    }, 1000);
  });

  // ❌ BAD: Promise with only setTimeout
  // Fixer: replaces with await waitFor(), adds waitFor import,
  //        AND makes the callback async if not already
  it('should not use Promise with just setTimeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Bad: unconditional wait
    // This is just an unconditional wait
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });

  // ❌ BAD: frame.waitForTimeout in Playwright
  it('should not use frame.waitForTimeout', async () => {
    const frame = page.mainFrame();
    await frame.waitForTimeout(2000); // Bad: unconditional wait
    await frame.click('#button');
  });

  // ❌ BAD: context.waitForTimeout in Playwright
  it('should not use context.waitForTimeout', async () => {
    await context.waitForTimeout(1000); // Bad: unconditional wait
    await page.click('#button');
  });
});