/**
 * Examples of no-index-queries rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

import { screen } from '@testing-library/react';

describe('Index-based Query Violations', () => {
  // ❌ BAD: Using nth-child selector
  it('should not use nth-child', () => {
    const thirdItem = document.querySelector('li:nth-child(3)');
    const fifthButton = document.querySelector('button:nth-child(5)');
    expect(thirdItem).toBeInTheDocument();
  });

  // ❌ BAD: Using first-child/last-child
  it('should not use first-child or last-child', () => {
    const firstItem = document.querySelector('.item:first-child');
    const lastItem = document.querySelector('.item:last-child');
    expect(firstItem).toBeVisible();
  });

  // ❌ BAD: Array index access on Testing Library query results
  it('should not access Testing Library query results by index', () => {
    // These patterns WILL be detected by the rule
    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0]; // Bad: index access
    const thirdButton = buttons[2]; // Bad: index access

    const items = screen.queryAllByText(/item/i);
    const secondItem = items[1]; // Bad: index access

    expect(firstButton).toBeDefined();
  });

  // ❌ BAD: Testing Library getAllBy* with index
  it('should not use index with getAllBy queries', () => {
    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0]; // Bad: index access
    const lastButton = buttons[buttons.length - 1]; // Bad: index access
    const thirdButton = buttons[2]; // Bad: index access

    const items = screen.getAllByTestId('item');
    const specificItem = items[3]; // Bad: index access

    expect(firstButton).toBeInTheDocument();
  });

  // ❌ BAD: Using data-index attributes
  it('should not use data-index attributes', () => {
    const element = document.querySelector('[data-index="0"]');
    const item = document.querySelector('[data-index="5"]');
    expect(element).toBeVisible();
  });

  // ❌ BAD: jQuery nth selectors
  it('should not use jQuery nth selectors', () => {
    const element = $('.item:eq(2)'); // jQuery nth selector
    const firstThree = $('.item:lt(3)'); // jQuery less than
    const afterSecond = $('.item:gt(1)'); // jQuery greater than

    expect(element.length).toBe(1);
  });

  // ❌ BAD: Cypress nth-child and index access
  it('should not use Cypress index patterns', () => {
    cy.get('li:nth-child(3)').click();
    cy.get('.item').eq(2).should('be.visible'); // .eq() is index-based
    cy.get('.button').first().click(); // .first() is position-based
    cy.get('.button').last().click(); // .last() is position-based
  });

  // ❌ BAD: Playwright nth selectors
  it('should not use Playwright nth patterns', async () => {
    await page.click('button:nth-child(2)');
    await page.click('.item >> nth=3');
    const buttons = await page.$$('.button');
    await buttons[0].click(); // Index access on element handles
  });

  // ❌ BAD: Using at() method for index access
  it('should not use at() for index access', () => {
    const items = screen.getAllByTestId('item');
    const lastItem = items.at(-1); // Bad: at() with index
    const secondItem = items.at(1); // Bad: at() with index

    expect(lastItem).toBeInTheDocument();
  });

  // ❌ BAD: XPath with position
  it('should not use XPath position', () => {
    const element = document.evaluate(
      '//div[@class="item"][2]',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    expect(element).toBeDefined();
  });
});

/**
 * Note: The following patterns are NOT currently detected by the rule
 * but are still considered bad practices:
 */
describe('Patterns NOT detected (but still bad)', () => {
  it('generic DOM queries with index access', () => {
    // These won't trigger the rule but are still fragile:
    const items = document.querySelectorAll('.item');
    const thirdItem = items[2]; // Not detected - only Testing Library queries are checked

    const buttons = document.getElementsByClassName('button');
    const firstButton = buttons[0]; // Not detected - only Testing Library queries are checked

    // The rule focuses on Testing Library, Cypress, and Playwright patterns
    // Generic DOM queries would require additional implementation
  });
});