/**
 * @fileoverview Tests for no-long-text-match rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-long-text-match');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-long-text-match', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'getByText("This is a very long text that would normally trigger the rule but we are not in a test file")',
      filename: 'src/app.js'
    },

    // Short text queries are fine
    {
      code: 'getByText("Submit")',
      filename: 'Button.test.js'
    },
    {
      code: 'screen.getByText("Click me")',
      filename: 'Click.test.js'
    },
    {
      code: 'queryByText("Loading...")',
      filename: 'Loading.test.js'
    },
    {
      code: 'findByText("Error occurred")',
      filename: 'Error.test.js'
    },

    // Using test IDs or roles instead
    {
      code: 'getByTestId("long-description")',
      filename: 'TestId.test.js'
    },
    {
      code: 'getByRole("article", { name: "Main content" })',
      filename: 'Role.test.js'
    },
    {
      code: 'getByLabelText("Description")',
      filename: 'Label.test.js'
    },

    // Using partial matching
    {
      code: 'getByText(/Welcome to/)',
      filename: 'Regex.test.js'
    },
    {
      code: 'screen.getByText(/loading/i)',
      filename: 'RegexCase.test.js'
    },

    // Variables (harder to detect)
    {
      code: 'const longText = "This is a very long text..."; getByText(longText)',
      filename: 'Variable.test.js'
    },
    {
      code: 'getByText(getLongText())',
      filename: 'Function.test.js'
    },

    // Template literals with short content
    {
      code: 'getByText(`User: ${username}`)',
      filename: 'Template.test.js'
    },

    // Text content checks (not queries)
    {
      code: 'expect(element).toHaveTextContent("This is a long text but it is in an assertion not a query")',
      filename: 'Assertion.test.js'
    },

    // Custom maxLength setting
    {
      code: 'getByText("This text is exactly 100 chars long")',
      filename: 'CustomLength.test.js',
      options: [{ maxLength: 100 }]
    }
  ],

  invalid: [
    // Long text in getByText
    {
      code: 'getByText("This is a very long text that should probably be matched by a test ID or a more stable selector instead of the full text content")',
      filename: 'LongText.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 139, maxLength: 50 }
      }]
    },
    {
      code: 'screen.getByText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor")',
      filename: 'Lorem.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 83, maxLength: 50 }
      }]
    },

    // Long text in queryByText
    {
      code: 'queryByText("This is another very long text that exceeds the recommended length for text queries")',
      filename: 'QueryLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 87, maxLength: 50 }
      }]
    },

    // Long text in findByText
    {
      code: 'await findByText("This long text will make the test brittle because any change to the wording will break it")',
      filename: 'FindLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 95, maxLength: 50 }
      }]
    },

    // getAllByText with long text
    {
      code: 'getAllByText("This is a repeated long text that appears multiple times in the component")',
      filename: 'GetAllLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 80, maxLength: 50 }
      }]
    },

    // Within queries with long text
    {
      code: 'within(container).getByText("This is a long text within a specific container that should use a better selector")',
      filename: 'WithinLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 99, maxLength: 50 }
      }]
    },

    // Template literals with long content
    {
      code: 'getByText(`This is a very long template literal that contains way too much text for a reliable test query`)',
      filename: 'TemplateLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 97, maxLength: 50 }
      }]
    },

    // Custom maxLength violation
    {
      code: 'getByText("Short text")',
      filename: 'CustomShort.test.js',
      options: [{ maxLength: 5 }],
      errors: [{
        messageId: 'textTooLong',
        data: { length: 10, maxLength: 5 }
      }]
    },
    {
      code: 'getByText("This text is longer than 20 characters")',
      filename: 'Custom20.test.js',
      options: [{ maxLength: 20 }],
      errors: [{
        messageId: 'textTooLong',
        data: { length: 38, maxLength: 20 }
      }]
    },

    // Multiline text
    {
      code: 'getByText("This is a very long text\nthat spans multiple lines\nand should definitely use a better selector")',
      filename: 'Multiline.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 97, maxLength: 50 }
      }]
    },

    // With special characters
    {
      code: 'getByText("This is a long text with special chars: !@#$%^&*() that makes it even longer and more brittle")',
      filename: 'SpecialChars.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 97, maxLength: 50 }
      }]
    },

    // Multiple violations
    {
      code: `
        getByText("This is the first very long text that should not be used as a query selector");
        queryByText("This is the second very long text that also should not be used as a selector");
        findByText("And here is the third very long text that makes tests brittle and hard to maintain");
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'textTooLong', data: { length: 81, maxLength: 50 } },
        { messageId: 'textTooLong', data: { length: 82, maxLength: 50 } },
        { messageId: 'textTooLong', data: { length: 85, maxLength: 50 } }
      ]
    },

    // Cypress patterns
    {
      code: 'cy.contains("This is a very long text that should not be used in Cypress contains commands either")',
      filename: 'cypress.cy.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 89, maxLength: 50 }
      }]
    },

    // Playwright patterns
    {
      code: 'page.getByText("This is a very long text in Playwright that should also use a better selector strategy")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 95, maxLength: 50 }
      }]
    },
    {
      code: 'page.locator("text=This is a very long text selector that makes the test brittle and hard to maintain")',
      filename: 'playwright-locator.spec.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 93, maxLength: 50 }
      }]
    },

    // With punctuation
    {
      code: 'getByText("Hello, this is a long sentence with punctuation. It should not be used as a selector!")',
      filename: 'Punctuation.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 89, maxLength: 50 }
      }]
    },

    // With numbers
    {
      code: 'getByText("This text has numbers 123456789 and is way too long to be used as a reliable selector")',
      filename: 'Numbers.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 88, maxLength: 50 }
      }]
    }
  ]
});