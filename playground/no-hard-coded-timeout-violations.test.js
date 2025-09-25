/* eslint-disable test-flakiness/no-hard-coded-timeout */
/**
 * Examples of no-hard-coded-timeout rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Hard-coded Timeout Violations', () => {
  // ❌ BAD: Using setTimeout with fixed delay
  it('should wait with setTimeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    expect(document.querySelector('.loaded')).toBeTruthy();
  });

  // ❌ BAD: Using setTimeout directly
  it('should use raw setTimeout', (done) => {
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 3000);
  });

  // ❌ BAD: Promise-based timeout
  it('should wait with promise timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });

  // ❌ BAD: Using setInterval
  it('should not use setInterval', () => {
    const interval = setInterval(() => {
      console.log('checking...');
    }, 1000);

    // cleanup would happen here
    clearInterval(interval);
  });

  // ❌ BAD: Custom wait/delay functions
  it('should avoid custom wait functions', async () => {
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await wait(2000);
    expect(true).toBe(true);
  });

  // ❌ BAD: Cypress fixed wait
  it('should not use cy.wait with number', () => {
    cy.visit('/page');
    cy.wait(5000); // Bad: fixed delay
    cy.get('.content').should('be.visible');
  });

  // ❌ BAD: Sleep/delay/pause patterns
  it('should avoid sleep patterns', async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    await sleep(1500);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    await delay(2000);

    const pause = (ms) => new Promise(r => setTimeout(r, ms));
    await pause(1000);
  });
});