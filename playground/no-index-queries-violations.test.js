/**
 * Examples of no-index-queries rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

import { screen, within } from '@testing-library/react';

describe('Index-based Query Violations', () => {
  // ❌ BAD: Using nth-child selector
  it('should not use nth-child', () => {
    const thirdItem = document.querySelector('li:nth-child(3)');
    const fifthButton = document.querySelector('button:nth-child(5)');
    expect(thirdItem).toBeInTheDocument();
    expect(fifthButton).toBeDefined();
  });

  // ❌ BAD: Using first-child/last-child
  it('should not use first-child or last-child', () => {
    const firstItem = document.querySelector('.item:first-child');
    const lastItem = document.querySelector('.item:last-child');
    expect(firstItem).toBeVisible();
    expect(lastItem).toBeDefined();
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
    expect(thirdButton).toBeDefined();
    expect(secondItem).toBeDefined();
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
    expect(lastButton).toBeDefined();
    expect(thirdButton).toBeDefined();
    expect(specificItem).toBeDefined();
  });

  // ❌ BAD: Using data-index attributes
  it('should not use data-index attributes', () => {
    const element = document.querySelector('[data-index="0"]');
    const item = document.querySelector('[data-index="5"]');
    expect(element).toBeVisible();
    expect(item).toBeDefined();
  });

  // ❌ BAD: jQuery nth selectors
  it('should not use jQuery nth selectors', () => {
    const element = $('.item:eq(2)'); // jQuery nth selector
    const firstThree = $('.item:lt(3)'); // jQuery less than
    const afterSecond = $('.item:gt(1)'); // jQuery greater than

    expect(element.length).toBe(1);
    expect(firstThree.length).toBeGreaterThan(0);
    expect(afterSecond.length).toBeGreaterThan(0);
  });

  // ❌ BAD: Cypress nth-child and index access
  it('should not use Cypress index patterns', () => {
    cy.get('li:nth-child(3)').click();
    cy.get('.item').eq(2).should('be.visible'); // .eq() is index-based
    // eslint-disable-next-line test-flakiness/await-async-events
    cy.get('.button').first().click(); // .first() is position-based
    // eslint-disable-next-line test-flakiness/await-async-events
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
    expect(secondItem).toBeDefined();
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

  // ❌ BAD: findAllBy* with index access
  it('should not use findAllBy* with index', async () => {
    const buttons = await screen.findAllByRole('button');
    const firstButton = buttons[0]; // Bad: index access
    const lastButton = buttons[buttons.length - 1]; // Bad: index access

    const labels = await screen.findAllByLabelText('input');
    const thirdLabel = labels[2]; // Bad: index access

    const texts = await screen.findAllByText(/submit/i);
    const specificText = texts[1]; // Bad: index access

    expect(firstButton).toBeInTheDocument();
    expect(lastButton).toBeDefined();
    expect(thirdLabel).toBeDefined();
    expect(specificText).toBeVisible();
  });

  // ❌ BAD: screen.getAllBy* with direct index access
  it('should not use screen.getAllBy* with direct index access', () => {
    // Direct index access on screen.getAllBy* results
    const firstRole = screen.getAllByRole('button')[0]; // Bad: direct index
    const secondTestId = screen.getAllByTestId('item')[1]; // Bad: direct index
    const thirdText = screen.getAllByText(/click/i)[2]; // Bad: direct index
    const lastLabel = screen.getAllByLabelText('checkbox')[screen.getAllByLabelText('checkbox').length - 1]; // Bad: complex index

    expect(firstRole).toBeInTheDocument();
    expect(secondTestId).toBeDefined();
    expect(thirdText).toBeVisible();
    expect(lastLabel).toBeDefined();
  });

  // ❌ BAD: within().getAllBy* with index access
  it('should not use within().getAllBy* with index', () => {
    const { getByTestId, getAllByRole, getAllByText } = screen;
    const container = getByTestId('container');

    // within() patterns with index access
    const withinContainer = within(container);
    const buttons = withinContainer.getAllByRole('button');
    const firstButton = buttons[0]; // Bad: index on within result

    const items = within(container).getAllByTestId('item');
    const secondItem = items[1]; // Bad: index on within result

    const links = within(document.body).getAllByRole('link');
    const thirdLink = links[2]; // Bad: index on within result

    expect(firstButton).toBeInTheDocument();
    expect(secondItem).toBeDefined();
    expect(thirdLink).toBeVisible();
  });

  // ❌ BAD: Complex chained patterns with index
  it('should not use complex chained patterns with index', () => {
    // Chained method calls with index access
    const buttons = screen.getAllByRole('button');
    const filteredButtons = buttons.filter(btn => btn.textContent.includes('Submit'));
    const firstFiltered = filteredButtons[0]; // Bad: index after filter

    // Map and then index access
    const items = screen.getAllByTestId('item');
    const mapped = items.map(item => item.querySelector('.content'));
    const secondMapped = mapped[1]; // Bad: index after map

    // Slice and then index access
    const links = screen.getAllByRole('link');
    const sliced = links.slice(1, 5);
    const firstSliced = sliced[0]; // Bad: index after slice

    // Multiple chained operations
    const elements = screen.getAllByText(/test/i)
      .filter(el => el.classList.contains('active'))
      .slice(0, 3);
    const lastElement = elements[elements.length - 1]; // Bad: index after chain

    expect(firstFiltered).toBeDefined();
    expect(secondMapped).toBeDefined();
    expect(firstSliced).toBeInTheDocument();
    expect(lastElement).toBeVisible();
  });

  // ❌ BAD: Destructuring with index patterns
  it('should not use destructuring with index patterns', () => {
    const buttons = screen.getAllByRole('button');
    const [first, second, , fourth] = buttons; // Bad: destructuring is index-based

    const items = screen.getAllByTestId('item');
    const [firstItem, ...rest] = items; // Bad: destructuring with rest
    const lastItem = rest[rest.length - 1]; // Bad: index on rest array

    expect(first).toBeInTheDocument();
    expect(second).toBeDefined();
    expect(fourth).toBeVisible();
    expect(firstItem).toBeDefined();
    expect(lastItem).toBeDefined();
  });

  // ❌ BAD: Loop with index access
  it('should not use loops with index access', () => {
    const buttons = screen.getAllByRole('button');

    // For loop with index
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]; // Bad: index in loop
      if (i === 2) {
        expect(button).toHaveClass('special');
      }
    }

    // forEach with index parameter
    screen.getAllByTestId('item').forEach((item, index) => {
      if (index === 0) { // Bad: using index parameter
        expect(item).toHaveClass('first');
      }
      if (index === screen.getAllByTestId('item').length - 1) { // Bad: using index
        expect(item).toHaveClass('last');
      }
    });
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
    expect(thirdItem).toBeDefined();
    expect(firstButton).toBeDefined();
  });
});