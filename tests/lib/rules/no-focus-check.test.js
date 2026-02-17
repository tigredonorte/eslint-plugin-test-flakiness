/**
 * @fileoverview Tests for no-focus-check rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-focus-check');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

const importWaitFor = 'import { waitFor } from \'@testing-library/react\';\n';

ruleTester.run('no-focus-check', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'expect(document.activeElement).toBe(input)',
      filename: 'src/app.js'
    },
    {
      code: 'expect(element).toHaveFocus()',
      filename: 'src/component.js'
    },

    // Non-focus related checks
    {
      code: 'expect(element).toBeVisible()',
      filename: 'Visibility.test.js'
    },
    {
      code: 'expect(element).toBeInTheDocument()',
      filename: 'Document.test.js'
    },
    {
      code: 'expect(element.value).toBe("test")',
      filename: 'Value.test.js'
    },

    // Using waitFor for focus checks (valid pattern)
    {
      code: 'await waitFor(() => expect(element).toHaveFocus())',
      filename: 'WaitForFocus.test.js'
    },
    {
      code: 'waitFor(() => { expect(document.activeElement).toBe(input) })',
      filename: 'WaitForActive.test.js'
    },

    // Different property checks
    {
      code: 'expect(element.className).toBe("focused")',
      filename: 'ClassName.test.js'
    },
    {
      code: 'expect(element.dataset.focused).toBe("true")',
      filename: 'Dataset.test.js'
    },

    // Non-focus method names
    {
      code: 'element.blur()',
      filename: 'Blur.test.js'
    },
    {
      code: 'component.setFocus(element)',
      filename: 'SetFocus.test.js'
    },

    // Valid tabIndex and ARIA checks with waitFor
    {
      code: 'await waitFor(() => expect(element.tabIndex).toBe(0))',
      filename: 'TabIndexWithWaitFor.test.js'
    },
    {
      code: 'await waitFor(() => expect(element.getAttribute("tabindex")).toBe("0"))',
      filename: 'TabIndexAttrWithWaitFor.test.js'
    },
    {
      code: 'await waitFor(() => expect(element.getAttribute("aria-focused")).toBe("true"))',
      filename: 'AriaFocusedWithWaitFor.test.js'
    },
    {
      code: 'await waitFor(() => expect(element.hasAttribute("aria-activedescendant")).toBeTruthy())',
      filename: 'AriaActiveWithWaitFor.test.js'
    },

    // Non-focus related tabIndex/aria checks
    {
      code: 'expect(element.className).toBe("tab-index-0")',
      filename: 'TabIndexClass.test.js'
    },
    {
      code: 'expect(element.dataset.ariaFocused).toBe("true")',
      filename: 'AriaDataset.test.js'
    }
  ],

  invalid: [
    // Direct focus checks
    {
      code: 'expect(element).toHaveFocus()',
      filename: 'Focus.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element).toHaveFocus())'
    },
    {
      code: 'expect(input).toHaveFocus()',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(input).toHaveFocus())'
    },
    {
      code: 'expect(button).not.toHaveFocus()',
      filename: 'NotFocus.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(button).not.toHaveFocus())'
    },

    // document.activeElement checks
    {
      code: 'expect(document.activeElement).toBe(input)',
      filename: 'ActiveElement.test.js',
      errors: [{
        messageId: 'avoidActiveElement'
      }],
      output: importWaitFor + 'await waitFor(() => expect(document.activeElement).toBe(input))'
    },
    {
      code: 'expect(document.activeElement).toEqual(element)',
      filename: 'ActiveEqual.test.js',
      errors: [{
        messageId: 'avoidActiveElement'
      }],
      output: importWaitFor + 'await waitFor(() => expect(document.activeElement).toEqual(element))'
    },
    {
      code: 'expect(document.activeElement.id).toBe("myInput")',
      filename: 'ActiveId.test.js',
      errors: [{
        messageId: 'avoidActiveElement'
      }],
      output: importWaitFor + 'await waitFor(() => expect(document.activeElement.id).toBe("myInput"))'
    },

    // :focus pseudo-selector checks
    {
      code: 'expect(element.matches(":focus")).toBe(true)',
      filename: 'Matches.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },
    {
      code: 'expect(document.querySelector(":focus")).toBe(input)',
      filename: 'QueryFocus.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },
    {
      code: 'const focused = document.querySelector(":focus")',
      filename: 'FocusVariable.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },

    // element.focus() without proper waiting
    {
      code: 'element.focus(); expect(element).toHaveFocus()',
      filename: 'FocusAndCheck.test.js',
      errors: [
        { messageId: 'useWaitForFocus' },
        { messageId: 'avoidFocusCheck' }
      ],
      output: importWaitFor + 'await act(async () => { element.focus() }); await waitFor(() => expect(element).toHaveFocus())'
    },
    {
      code: 'input.focus()',
      filename: 'InputFocus.test.js',
      errors: [{
        messageId: 'useWaitForFocus'
      }],
      output: 'await act(async () => { input.focus() })'
    },

    // Multiple violations
    {
      code: `
        element.focus();
        expect(document.activeElement).toBe(element);
        expect(element).toHaveFocus();
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'useWaitForFocus' },
        { messageId: 'avoidActiveElement' },
        { messageId: 'avoidFocusCheck' }
      ],
      output: `
        import { waitFor } from '@testing-library/react';
await act(async () => { element.focus() })
        await waitFor(() => expect(document.activeElement).toBe(element))
        expect(element).toHaveFocus();
      `
    },

    // Different test file extensions
    {
      code: 'expect(element).toHaveFocus()',
      filename: 'Focus.spec.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element).toHaveFocus())'
    },
    {
      code: 'expect(document.activeElement).toBe(input)',
      filename: 'test/active.test.ts',
      errors: [{
        messageId: 'avoidActiveElement'
      }],
      output: importWaitFor + 'await waitFor(() => expect(document.activeElement).toBe(input))'
    },

    // Focus within other assertions
    {
      code: 'expect(element).toHaveFocus() && expect(element.value).toBe("test")',
      filename: 'Compound.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element).toHaveFocus() && expect(element.value).toBe("test"))'
    },

    // Multi-statement line with focus call followed by assertion
    {
      code: 'element.focus(); expect(element).toHaveFocus();',
      filename: 'MultiStatement.test.js',
      errors: [
        { messageId: 'useWaitForFocus' },
        { messageId: 'avoidFocusCheck' }
      ],
      output: importWaitFor + 'await act(async () => { element.focus() }); await waitFor(() => expect(element).toHaveFocus())'
    },
    {
      code: 'const hasFocus = expect(element).toHaveFocus()',
      filename: 'Variable.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },

    // tabIndex assertions
    {
      code: 'expect(element.tabIndex).toBe(0)',
      filename: 'TabIndex.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element.tabIndex).toBe(0))'
    },
    {
      code: 'expect(button.tabIndex).toEqual(-1)',
      filename: 'TabIndexButton.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(button.tabIndex).toEqual(-1))'
    },
    {
      code: 'expect(element.getAttribute("tabindex")).toBe("0")',
      filename: 'TabIndexAttr.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element.getAttribute("tabindex")).toBe("0"))'
    },
    {
      code: 'expect(element.getAttribute("tabIndex")).toEqual("-1")',
      filename: 'TabIndexCamelCase.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element.getAttribute("tabIndex")).toEqual("-1"))'
    },

    // ARIA focus attributes
    {
      code: 'expect(element.getAttribute("aria-focused")).toBe("true")',
      filename: 'AriaFocused.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element.getAttribute("aria-focused")).toBe("true"))'
    },
    {
      code: 'expect(element.hasAttribute("aria-activedescendant")).toBeTruthy()',
      filename: 'AriaActiveDescendant.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element.hasAttribute("aria-activedescendant")).toBeTruthy())'
    },
    {
      code: 'expect(element.getAttribute("aria-activedescendant")).toBe("item-1")',
      filename: 'AriaActiveDescValue.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element.getAttribute("aria-activedescendant")).toBe("item-1"))'
    },
    {
      code: 'expect(element.hasAttribute("aria-focused")).toBeFalsy()',
      filename: 'AriaFocusedFalsy.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: importWaitFor + 'await waitFor(() => expect(element.hasAttribute("aria-focused")).toBeFalsy())'
    },

    // Cypress/Playwright focus checks (if applicable)
    {
      code: 'cy.focused().should("have.id", "myInput")',
      filename: 'cypress.cy.js',
      errors: [{
        messageId: 'avoidFocusCheckCypress'
      }]
    },
    {
      code: 'await expect(page.locator(":focus")).toHaveId("myInput")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },

    // Focus call followed by focus assertion - should trigger both errors
    {
      code: `
        element.focus();
        expect(document.activeElement).toBe(element);
      `,
      filename: 'test.test.js',
      errors: [
        { messageId: 'useWaitForFocus' },
        { messageId: 'avoidActiveElement' }
      ],
      output: `
        import { waitFor } from '@testing-library/react';
await act(async () => { element.focus() })
        await waitFor(() => expect(document.activeElement).toBe(element))
      `
    },

    // Focus call followed by focus assertion (different pattern)
    {
      code: `
        input.focus();
        expect(input).toHaveFocus();
      `,
      filename: 'test.test.js',
      errors: [
        { messageId: 'useWaitForFocus' },
        { messageId: 'avoidFocusCheck' }
      ],
      output: `
        import { waitFor } from '@testing-library/react';
await act(async () => { input.focus() })
        await waitFor(() => expect(input).toHaveFocus())
      `
    },

    // Multiple statements on line with focus
    {
      code: 'element.focus(); console.log("focused");',
      filename: 'test.test.js',
      errors: [{
        messageId: 'useWaitForFocus'
      }],
      output: 'await act(async () => { element.focus() }); console.log("focused");'
    },

    // Focus call nested in multiple parent nodes (covers line 187)
    {
      code: '(() => { return element.focus(); })()',
      filename: 'nested.test.js',
      errors: [{
        messageId: 'useWaitForFocus'
      }],
      output: 'await act(async () => { element.focus() });'
    },

    // Multiple statements on same line: focus + assertion (covers hasMultipleStatements branch)
    {
      code: 'element.focus(); expect(element).toHaveFocus();',
      filename: 'test.test.js',
      errors: [
        { messageId: 'useWaitForFocus' },
        { messageId: 'avoidFocusCheck' }
      ],
      output: importWaitFor + 'await act(async () => { element.focus() }); await waitFor(() => expect(element).toHaveFocus())'
    },

    // Playwright framework: focus assertion uses framework-specific message (no fix)
    {
      code: `import { test, expect } from '@playwright/test';
expect(element).toHaveFocus();`,
      filename: 'focus.spec.js',
      errors: [{
        messageId: 'avoidFocusCheckPlaywright'
      }]
    },

    // Playwright framework: activeElement uses framework-specific message (no fix)
    {
      code: `import { test, expect } from '@playwright/test';
expect(document.activeElement).toBe(input);`,
      filename: 'active.spec.js',
      errors: [{
        messageId: 'avoidActiveElementPlaywright'
      }]
    },

    // Cypress framework: focus assertion uses framework-specific message
    {
      code: `import { mount } from 'cypress/react';
expect(element).toHaveFocus();`,
      filename: 'focus.cy.js',
      errors: [{
        messageId: 'avoidFocusCheckCypress'
      }]
    },

    // --- Coverage: asyncFixes === null guards (getter/setter/constructor) ---

    // Focus assertion inside getter — createWaitForFix asyncFixes null (no fix)
    {
      code: `import { render } from '@testing-library/react';
class Foo { get bar() { expect(element).toHaveFocus(); } }`,
      filename: 'GetterFocus.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },

    // document.activeElement inside getter — checkActiveElement asyncFixes null (no fix)
    {
      code: `import { render } from '@testing-library/react';
class Foo { get bar() { expect(document.activeElement).toBe(input); } }`,
      filename: 'GetterActive.test.js',
      errors: [{
        messageId: 'avoidActiveElement'
      }]
    },

    // focus() followed by assertion inside setter — focus+assertion asyncFixes null (no fix)
    {
      code: `import { render } from '@testing-library/react';
class Foo {
  set bar(v) {
    element.focus();
    expect(element).toHaveFocus();
  }
}`,
      filename: 'SetterFocusAssertion.test.js',
      errors: [
        { messageId: 'useWaitForFocus' },
        { messageId: 'avoidFocusCheck' }
      ]
    },

    // Standalone focus() inside constructor — standalone focus asyncFixes null (no fix)
    {
      code: `import { render } from '@testing-library/react';
class Foo { constructor() { element.focus(); } }`,
      filename: 'ConstructorFocus.test.js',
      errors: [{
        messageId: 'useWaitForFocus'
      }]
    },

    // Variable assignment with focus — default return null in IIFE/other fixer
    {
      code: 'const x = element.focus()',
      filename: 'VarFocus.test.js',
      errors: [{
        messageId: 'useWaitForFocus'
      }]
    },

    // Multi-line IIFE — hasMultipleStatements=false for IIFE fixer
    {
      code: `(() => {
  return element.focus();
})()`,
      filename: 'IIFEMultiLine.test.js',
      errors: [{
        messageId: 'useWaitForFocus'
      }],
      output: 'await act(async () => { element.focus() })'
    }
  ]
});