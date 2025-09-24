/**
 * @fileoverview Tests for no-long-text-match rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-long-text-match');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

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
    {
      code: 'getByText(new RegExp("This is a very long pattern that should be skipped because it is a regex"))',
      filename: 'RegExpConstructor.test.js'
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

    // Text content checks (not queries) - assertions are allowed
    {
      code: 'expect(element).toHaveTextContent("This is a long text but it is in an assertion not a query")',
      filename: 'Assertion.test.js'
    },

    // Custom maxLength setting
    {
      code: 'getByText("This text is exactly 100 chars long")',
      filename: 'CustomLength.test.js',
      options: [{ maxLength: 100 }]
    },

    // Exact match option (should skip)
    {
      code: 'screen.getByText("This is a very long text content", { exact: false })',
      filename: 'ExactFalse.test.js'
    },
    {
      code: 'getByText("Very long text with mixed options", { exact: false, other: true })',
      filename: 'ComplexExact.test.js'
    },

    // Within queries with partial matching
    {
      code: 'within(container).getByText(/part of long text/)',
      filename: 'WithinRegex.test.js'
    },

    // Member expression with screen object
    {
      code: 'screen.getByText(new RegExp("long pattern in member expression"))',
      filename: 'ScreenRegExp.test.js'
    },

    // Template literal in within queries
    {
      code: 'within(element).getByText(`Short ${variable}`)',
      filename: 'WithinTemplate.test.js'
    },


    // TestId queries when ignoreTestIds is enabled
    {
      code: 'getByTestId("this-is-a-very-long-test-id-that-should-be-ignored")',
      filename: 'TestIdIgnored.test.js',
      options: [{ ignoreTestIds: true }]
    },
    {
      code: 'getAllByTestId("another-very-long-test-id-that-should-be-skipped")',
      filename: 'AllTestIdIgnored.test.js',
      options: [{ ignoreTestIds: true }]
    },
    {
      code: 'within(container).getByTestId("long-test-id-in-within-should-be-ignored")',
      filename: 'WithinTestIdIgnored.test.js',
      options: [{ ignoreTestIds: true }]
    },

    // Screen.getByTestId with ignoreTestIds enabled (line 158)
    {
      code: 'screen.getByTestId("this-very-long-test-id-should-be-ignored-from-screen-object")',
      filename: 'ScreenTestIdIgnored.test.js',
      options: [{ ignoreTestIds: true }]
    },

    // RegExp constructor with allowPartialMatch=true (lines 116, 175, 231) - triggers return statements
    {
      code: 'getByText(new RegExp("This is a long pattern that will trigger RegExp return path"))',
      filename: 'RegExpReturnPath.test.js',
      options: [{ allowPartialMatch: true }]
    },
    {
      code: 'screen.getByText(new RegExp("This pattern triggers member expression RegExp return"))',
      filename: 'ScreenRegExpReturnPath.test.js',
      options: [{ allowPartialMatch: true }]
    },
    {
      code: 'within(container).getByText(new RegExp("This pattern triggers within RegExp return"))',
      filename: 'WithinRegExpReturnPath.test.js',
      options: [{ allowPartialMatch: true }]
    },

    // Exact false option in within expressions (lines 236-238)
    {
      code: 'within(container).getByText("Long text content", { exact: false })',
      filename: 'WithinExactFalse.test.js'
    },

    // Assertion with testId calls (lines 309-314)
    {
      code: 'expect(getByTestId("test-id")).toHaveTextContent("Short text")',
      filename: 'AssertionTestId.test.js',
      options: [{ ignoreTestIds: true }]
    },
    {
      code: 'expect(screen.getByTestId("test-id")).toHaveTextContent("Short")',
      filename: 'AssertionScreenTestId.test.js',
      options: [{ ignoreTestIds: true }]
    },

    // Text completely within comment bounds (line 71) - create literal string inside comment
    {
      code: '/* This is a comment with getByText("This long text should be ignored when inside comment bounds") embedded inside */',
      filename: 'TextCompletelyInComment.test.js',
      options: [{ ignoreComments: true }]
    }
  ],

  invalid: [
    // Long text in getByText
    {
      code: 'getByText("This is a very long text that should probably be matched by a test ID or a more stable selector instead of the full text content")',
      filename: 'LongText.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 128, maxLength: 50 }
      }]
    },
    {
      code: 'screen.getByText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor")',
      filename: 'Lorem.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 78, maxLength: 50 }
      }]
    },

    // Long text in queryByText
    {
      code: 'queryByText("This is another very long text that exceeds the recommended length for text queries")',
      filename: 'QueryLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 83, maxLength: 50 }
      }]
    },

    // Long text in findByText
    {
      code: 'await findByText("This long text will make the test brittle because any change to the wording will break it")',
      filename: 'FindLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 89, maxLength: 50 }
      }]
    },

    // getAllByText with long text
    {
      code: 'getAllByText("This is a repeated long text that appears multiple times in the component")',
      filename: 'GetAllLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 73, maxLength: 50 }
      }]
    },

    // Within queries with long text
    {
      code: 'within(container).getByText("This is a long text within a specific container that should use a better selector")',
      filename: 'WithinLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 81, maxLength: 50 }
      }]
    },

    // Template literals with long content
    {
      code: 'getByText(`This is a very long template literal that contains way too much text for a reliable test query`)',
      filename: 'TemplateLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 94, maxLength: 50 }
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
      code: 'getByText("This is a very long text that spans multiple lines and should definitely use a better selector")',
      filename: 'Multiline.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 94, maxLength: 50 }
      }]
    },

    // With special characters
    {
      code: 'getByText("This is a long text with special chars: !@#$%^&*() that makes it even longer and more brittle")',
      filename: 'SpecialChars.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 93, maxLength: 50 }
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
        { messageId: 'textTooLong', data: { length: 76, maxLength: 50 } },
        { messageId: 'textTooLong', data: { length: 76, maxLength: 50 } },
        { messageId: 'textTooLong', data: { length: 82, maxLength: 50 } }
      ]
    },

    // Cypress patterns
    {
      code: 'cy.contains("This is a very long text that should not be used in Cypress contains commands either")',
      filename: 'cypress.cy.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 84, maxLength: 50 }
      }]
    },

    // Playwright patterns
    {
      code: 'page.getByText("This is a very long text in Playwright that should also use a better selector strategy")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 86, maxLength: 50 }
      }]
    },
    {
      code: 'page.locator("text=This is a very long text selector that makes the test brittle and hard to maintain")',
      filename: 'playwright-locator.spec.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 82, maxLength: 50 }
      }]
    },

    // With punctuation
    {
      code: 'getByText("Hello, this is a long sentence with punctuation. It should not be used as a selector!")',
      filename: 'Punctuation.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 85, maxLength: 50 }
      }]
    },

    // With numbers
    {
      code: 'getByText("This text has numbers 123456789 and is way too long to be used as a reliable selector")',
      filename: 'Numbers.test.js',
      errors: [{
        messageId: 'avoidExactMatch',
        data: { length: 94, maxLength: 50 }
      }]
    },


    // Template literals in within() queries
    {
      code: 'within(container).getByText(`This is a very long template literal in a within query that should be flagged`)',
      filename: 'WithinTemplateLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 77, maxLength: 50 }
      }]
    },

    // Playwright template literal edge cases
    {
      code: 'page.getByText(`This is a very long template literal in Playwright that should trigger the rule`)',
      filename: 'PlaywrightTemplateLong.spec.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 79, maxLength: 50 }
      }]
    },

    // Template literals in test assertions (should still be flagged based on implementation)
    {
      code: 'expect(element).toHaveTextContent(`This is a very long template literal in an assertion that should be flagged according to the rule`)',
      filename: 'TemplateAssertion.test.js',
      errors: [{
        messageId: 'usePartialMatch',
        data: { length: 100, maxLength: 50 }
      }]
    },

    // Screen queries without exact option but with long text
    {
      code: 'screen.getByText("This is a very long text content without exact option specified")',
      filename: 'ScreenLongNoExact.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 63, maxLength: 50 }
      }]
    },


    // Template literals in member expressions (lines 199-204)
    {
      code: 'screen.getByText(`This is a very long template literal in member expression that should be flagged`)',
      filename: 'MemberTemplateLong.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 80, maxLength: 50 }
      }]
    },


    // Text not in comment (should still be flagged)
    {
      code: '/* comment */ getByText("This is a very long text that should be flagged because it is not actually in comment")',
      filename: 'CommentTest.test.js',
      errors: [{
        messageId: 'textTooLong',
        data: { length: 85, maxLength: 50 }
      }]
    },

    // Force regex pattern length checking by disabling allowPartialMatch
    {
      code: 'getByText("This has dynamic content with lots of numbers: 123456789")',
      filename: 'DynamicContent.test.js',
      errors: [{
        messageId: 'avoidExactMatch',
        data: { length: 65, maxLength: 50 }
      }]
    },

    // Regex pattern check when allowPartialMatch is false (lines 246-250)
    {
      code: 'getByText(/This is a very long regex pattern that should be checked for length even with disabled partial matching/)',
      filename: 'RegexPatternCheck.test.js',
      options: [{ allowPartialMatch: false }],
      errors: [{
        messageId: 'textTooLong',
        data: { length: 103, maxLength: 50 }
      }]
    },

    // Member expression regex pattern check (similar lines 190-194)
    {
      code: 'screen.getByText(/Another very long regex pattern in member expression when partial matching is disabled/)',
      filename: 'MemberRegexCheck.test.js',
      options: [{ allowPartialMatch: false }],
      errors: [{
        messageId: 'textTooLong',
        data: { length: 86, maxLength: 50 }
      }]
    },

    // Regex literal pattern exceeding maxLength with allowPartialMatch=false (lines 246-250)
    {
      code: 'within(container).getByText(/This is a very long regex pattern that should be checked for pattern length in within expressions/)',
      filename: 'WithinRegexPatternCheck.test.js',
      options: [{ allowPartialMatch: false }],
      errors: [{
        messageId: 'textTooLong',
        data: { length: 97, maxLength: 50 }
      }]
    }

  ]
});