/**
 * @fileoverview Tests for no-index-queries rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-index-queries');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-index-queries', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'elements[0].click()',
      filename: 'src/app.js'
    },
    {
      code: 'queryAllByRole("button")[1]',
      filename: 'src/component.js'
    },

    // Using specific queries
    {
      code: 'getByRole("button", { name: "Submit" })',
      filename: 'Button.test.js'
    },
    {
      code: 'getByTestId("submit-button")',
      filename: 'TestId.test.js'
    },
    {
      code: 'getByLabelText("Email")',
      filename: 'Label.test.js'
    },
    {
      code: 'getByText("Click me")',
      filename: 'Text.test.js'
    },

    // Using find/filter methods
    {
      code: 'buttons.find(btn => btn.textContent === "Submit")',
      filename: 'Find.test.js'
    },
    {
      code: 'elements.filter(el => el.classList.contains("active"))',
      filename: 'Filter.test.js'
    },

    // Non-query array access
    {
      code: 'const data = [1, 2, 3]; expect(data[0]).toBe(1)',
      filename: 'Array.test.js'
    },
    {
      code: 'const items = getItems(); items[0]',
      filename: 'Items.test.js'
    },

    // Using within helper
    {
      code: 'within(container).getByRole("button")',
      filename: 'Within.test.js'
    },

    // Iterating through all elements
    {
      code: 'queryAllByRole("listitem").forEach(item => { expect(item).toBeVisible() })',
      filename: 'ForEach.test.js'
    },
    {
      code: 'for (const button of queryAllByRole("button")) { button.click() }',
      filename: 'ForOf.test.js'
    },

    // Using length check
    {
      code: 'expect(queryAllByRole("button")).toHaveLength(3)',
      filename: 'Length.test.js'
    },
    {
      code: 'const count = queryAllByRole("listitem").length',
      filename: 'Count.test.js'
    },

    // Dynamic index (harder to detect)
    {
      code: 'const index = getIndex(); elements[index]',
      filename: 'DynamicIndex.test.js'
    },
    {
      code: 'elements[i]',
      filename: 'Variable.test.js'
    }
  ],

  invalid: [
    // queryAll with index access
    {
      code: 'queryAllByRole("button")[0]',
      filename: 'QueryAll.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'queryByRole("button")'
    },
    {
      code: 'queryAllByRole("button")[1]',
      filename: 'QueryAllIndex.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '1' }
      }],
      output: 'queryAllByRole("button")[1] /* Use a more specific query instead of index */'
    },
    {
      code: 'queryAllByText("Click")[0].click()',
      filename: 'QueryAllClick.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'queryByText("Click").click()'
    },

    // getAllBy with index access
    {
      code: 'getAllByRole("listitem")[2]',
      filename: 'GetAll.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '2' }
      }],
      output: 'getAllByRole("listitem")[2] /* Use a more specific query instead of index */'
    },
    {
      code: 'getAllByTestId("item")[0]',
      filename: 'GetAllTestId.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'getByTestId("item")'
    },

    // findAllBy with index access
    {
      code: 'await findAllByRole("button")[0]',
      filename: 'FindAll.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'await findByRole("button")'
    },
    {
      code: '(await findAllByText("Loading"))[1]',
      filename: 'FindAllAwait.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '1' }
      }],
      output: '(await findAllByText("Loading"))[1] /* Use a more specific query instead of index */'
    },

    // screen.queryAll with index
    {
      code: 'screen.queryAllByRole("button")[0]',
      filename: 'ScreenQueryAll.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'screen.queryByRole("button")'
    },
    {
      code: 'screen.getAllByLabelText("Name")[0]',
      filename: 'ScreenGetAll.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'screen.getByLabelText("Name")'
    },

    // within().queryAll with index
    {
      code: 'within(container).queryAllByRole("button")[0]',
      filename: 'WithinQueryAll.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'within(container).queryByRole("button")'
    },
    {
      code: 'within(form).getAllByRole("textbox")[1]',
      filename: 'WithinGetAll.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '1' }
      }],
      output: 'within(form).getAllByRole("textbox")[1] /* Use a more specific query instead of index */'
    },

    // Using at() method
    {
      code: 'queryAllByRole("button").at(0)',
      filename: 'AtMethod.test.js',
      errors: [{
        messageId: 'avoidAtMethod'
      }]
    },
    {
      code: 'getAllByTestId("item").at(-1)',
      filename: 'AtNegative.test.js',
      errors: [{
        messageId: 'avoidAtMethod'
      }]
    },

    // Using first/last on arrays (custom methods)
    {
      code: 'queryAllByRole("button").first()',
      filename: 'First.test.js',
      errors: [{
        messageId: 'useSpecificQuery'
      }]
    },
    {
      code: 'getAllByText("Item").last()',
      filename: 'Last.test.js',
      errors: [{
        messageId: 'useSpecificQuery'
      }]
    },

    // nth-child selectors
    {
      code: 'container.querySelector("button:nth-child(2)")',
      filename: 'NthChild.test.js',
      errors: [{
        messageId: 'avoidNthChild'
      }]
    },
    {
      code: 'document.querySelector("li:nth-of-type(3)")',
      filename: 'NthOfType.test.js',
      errors: [{
        messageId: 'avoidNthChild'
      }]
    },
    {
      code: 'element.querySelector(":first-child")',
      filename: 'FirstChild.test.js',
      errors: [{
        messageId: 'avoidNthChild'
      }]
    },
    {
      code: 'container.querySelector(":last-child")',
      filename: 'LastChild.test.js',
      errors: [{
        messageId: 'avoidNthChild'
      }]
    },

    // Complex patterns
    {
      code: 'expect(queryAllByRole("button")[0]).toHaveTextContent("Submit")',
      filename: 'ExpectIndex.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }],
      output: 'expect(queryByRole("button")).toHaveTextContent("Submit")'
    },
    {
      code: 'const buttons = queryAllByRole("button"); buttons[0].click()',
      filename: 'VariableIndex.test.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }]
    },

    // Multiple violations
    {
      code: `
        queryAllByRole("button")[0].click();
        getAllByText("Item")[1].focus();
        container.querySelector("li:nth-child(3)");
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidIndexQuery', data: { index: '0' } },
        { messageId: 'avoidIndexQuery', data: { index: '1' } },
        { messageId: 'avoidNthChild' }
      ]
    },

    // Cypress patterns
    {
      code: 'cy.get("button").eq(0)',
      filename: 'cypress.cy.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }]
    },
    {
      code: 'cy.get("li").first()',
      filename: 'cypress-first.cy.js',
      errors: [{
        messageId: 'useSpecificQuery'
      }]
    },
    {
      code: 'cy.get("li").last()',
      filename: 'cypress-last.cy.js',
      errors: [{
        messageId: 'useSpecificQuery'
      }]
    },

    // Playwright patterns
    {
      code: 'page.locator("button").nth(0)',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'avoidIndexQuery',
        data: { index: '0' }
      }]
    },
    {
      code: 'page.locator("li").first()',
      filename: 'playwright-first.spec.js',
      errors: [{
        messageId: 'useSpecificQuery'
      }]
    },
    {
      code: 'page.locator("li").last()',
      filename: 'playwright-last.spec.js',
      errors: [{
        messageId: 'useSpecificQuery'
      }]
    }
  ]
});