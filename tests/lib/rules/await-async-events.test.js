/**
 * @fileoverview Tests for await-async-events rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/await-async-events');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('await-async-events', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'userEvent.click(button)',
      filename: 'src/app.js'
    },
    {
      code: 'fireEvent.click(button)',
      filename: 'src/component.jsx'
    },

    // Properly awaited userEvent methods
    {
      code: 'await userEvent.click(button)',
      filename: 'Component.test.js'
    },
    {
      code: 'await userEvent.type(input, "text")',
      filename: 'Input.test.js'
    },
    {
      code: 'await userEvent.clear(input)',
      filename: 'Form.test.js'
    },
    {
      code: 'await userEvent.selectOptions(select, "option1")',
      filename: 'Select.test.js'
    },
    {
      code: 'await userEvent.hover(element)',
      filename: 'Hover.test.js'
    },
    {
      code: 'await userEvent.unhover(element)',
      filename: 'Hover.test.js'
    },
    {
      code: 'await userEvent.upload(input, file)',
      filename: 'Upload.test.js'
    },
    {
      code: 'await userEvent.tab()',
      filename: 'Navigation.test.js'
    },
    {
      code: 'await userEvent.paste(input, "text")',
      filename: 'Clipboard.test.js'
    },
    {
      code: 'await userEvent.keyboard("[Enter]")',
      filename: 'Keyboard.test.js'
    },

    // Properly awaited fireEvent methods
    {
      code: 'await fireEvent.click(button)',
      filename: 'Button.test.js'
    },
    {
      code: 'await fireEvent.change(input, { target: { value: "test" } })',
      filename: 'Input.test.js'
    },
    {
      code: 'await fireEvent.submit(form)',
      filename: 'Form.test.js'
    },
    {
      code: 'await fireEvent.focus(input)',
      filename: 'Focus.test.js'
    },
    {
      code: 'await fireEvent.blur(input)',
      filename: 'Blur.test.js'
    },
    {
      code: 'await fireEvent.keyDown(input, { key: "Enter" })',
      filename: 'Keyboard.test.js'
    },

    // Returned promises
    {
      code: 'return userEvent.click(button)',
      filename: 'Return.test.js'
    },
    {
      code: 'return fireEvent.click(button)',
      filename: 'Return.test.js'
    },

    // Promise chains
    {
      code: 'userEvent.click(button).then(() => console.log("done"))',
      filename: 'Chain.test.js'
    },
    {
      code: 'fireEvent.click(button).catch(err => console.error(err))',
      filename: 'Chain.test.js'
    },

    // Variable assignment (might be awaited later)
    {
      code: 'const promise = userEvent.click(button)',
      filename: 'Variable.test.js'
    },
    {
      code: 'const result = fireEvent.submit(form)',
      filename: 'Variable.test.js'
    },

    // Properly awaited act with async callback
    {
      code: 'await act(async () => { await doSomething() })',
      filename: 'Act.test.js'
    },
    {
      code: 'return act(async () => { await doSomething() })',
      filename: 'Act.test.js'
    },

    // act with sync callback doesn't need await
    {
      code: 'act(() => { doSomething() })',
      filename: 'Act.test.js'
    },

    // Playwright - properly awaited
    {
      code: 'await page.click("#button")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.fill("#input", "text")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.type("#input", "text")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.press("body", "Enter")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.check("#checkbox")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.selectOption("#select", "option1")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.goto("https://example.com")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.reload()',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.waitForSelector(".element")',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await page.screenshot()',
      filename: 'playwright.spec.js'
    },

    // Browser/context/frame methods
    {
      code: 'await browser.newPage()',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await context.newPage()',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await frame.click("#button")',
      filename: 'playwright.spec.js'
    },

    // Element methods - properly awaited
    {
      code: 'await element.click()',
      filename: 'Element.test.js'
    },
    {
      code: 'await button.focus()',
      filename: 'Button.test.js'
    },
    {
      code: 'await inputField.blur()',
      filename: 'Input.test.js'
    },
    {
      code: 'await formElement.submit()',
      filename: 'Form.test.js'
    },
    {
      code: 'await getByRole("button").click()',
      filename: 'Query.test.js'
    },
    {
      code: 'await screen.getByText("Submit").click()',
      filename: 'Screen.test.js'
    },

    // Custom async methods with configuration
    {
      code: 'await customAsyncMethod()',
      filename: 'Custom.test.js',
      options: [{ customAsyncMethods: ['customAsyncMethod'] }]
    },
    {
      code: 'return customAsyncMethod()',
      filename: 'Custom.test.js',
      options: [{ customAsyncMethods: ['customAsyncMethod'] }]
    },

    // Non-async methods don't need await
    {
      code: 'userEvent.setup()',
      filename: 'Setup.test.js'
    },
    {
      code: 'fireEvent(element, event)',
      filename: 'Event.test.js'
    },

    // Different object names that aren't the targeted ones
    {
      code: 'myUserEvent.click(button)',
      filename: 'Custom.test.js'
    },
    {
      code: 'customFireEvent.click(button)',
      filename: 'Custom.test.js'
    },
    {
      code: 'myPage.click(button)',
      filename: 'Custom.test.js'
    }
  ],

  invalid: [
    // userEvent methods without await
    {
      code: 'userEvent.click(button)',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'click' }
      }],
      output: 'await userEvent.click(button)'
    },
    {
      code: 'userEvent.dblClick(button)',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'dblClick' }
      }],
      output: 'await userEvent.dblClick(button)'
    },
    {
      code: 'userEvent.tripleClick(button)',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'tripleClick' }
      }],
      output: 'await userEvent.tripleClick(button)'
    },
    {
      code: 'userEvent.type(input, "text")',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'type' }
      }],
      output: 'await userEvent.type(input, "text")'
    },
    {
      code: 'userEvent.clear(input)',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'clear' }
      }],
      output: 'await userEvent.clear(input)'
    },
    {
      code: 'userEvent.selectOptions(select, "option1")',
      filename: 'Select.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'selectOptions' }
      }],
      output: 'await userEvent.selectOptions(select, "option1")'
    },
    {
      code: 'userEvent.deselectOptions(select, "option1")',
      filename: 'Select.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'deselectOptions' }
      }],
      output: 'await userEvent.deselectOptions(select, "option1")'
    },
    {
      code: 'userEvent.upload(input, file)',
      filename: 'Upload.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'upload' }
      }],
      output: 'await userEvent.upload(input, file)'
    },
    {
      code: 'userEvent.tab()',
      filename: 'Navigation.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'tab' }
      }],
      output: 'await userEvent.tab()'
    },
    {
      code: 'userEvent.hover(element)',
      filename: 'Hover.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'hover' }
      }],
      output: 'await userEvent.hover(element)'
    },
    {
      code: 'userEvent.unhover(element)',
      filename: 'Hover.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'unhover' }
      }],
      output: 'await userEvent.unhover(element)'
    },
    {
      code: 'userEvent.paste(input, "text")',
      filename: 'Clipboard.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'paste' }
      }],
      output: 'await userEvent.paste(input, "text")'
    },
    {
      code: 'userEvent.keyboard("[Enter]")',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'keyboard' }
      }],
      output: 'await userEvent.keyboard("[Enter]")'
    },

    // fireEvent methods without await
    {
      code: 'fireEvent.click(button)',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'click' }
      }],
      output: 'await fireEvent.click(button)'
    },
    {
      code: 'fireEvent.change(input, { target: { value: "test" } })',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'change' }
      }],
      output: 'await fireEvent.change(input, { target: { value: "test" } })'
    },
    {
      code: 'fireEvent.input(input, { target: { value: "test" } })',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'input' }
      }],
      output: 'await fireEvent.input(input, { target: { value: "test" } })'
    },
    {
      code: 'fireEvent.submit(form)',
      filename: 'Form.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'submit' }
      }],
      output: 'await fireEvent.submit(form)'
    },
    {
      code: 'fireEvent.focus(input)',
      filename: 'Focus.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'focus' }
      }],
      output: 'await fireEvent.focus(input)'
    },
    {
      code: 'fireEvent.blur(input)',
      filename: 'Blur.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'blur' }
      }],
      output: 'await fireEvent.blur(input)'
    },
    {
      code: 'fireEvent.keyDown(input, { key: "Enter" })',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'keyDown' }
      }],
      output: 'await fireEvent.keyDown(input, { key: "Enter" })'
    },
    {
      code: 'fireEvent.keyUp(input, { key: "Enter" })',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'keyUp' }
      }],
      output: 'await fireEvent.keyUp(input, { key: "Enter" })'
    },
    {
      code: 'fireEvent.keyPress(input, { key: "a" })',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'keyPress' }
      }],
      output: 'await fireEvent.keyPress(input, { key: "a" })'
    },
    {
      code: 'fireEvent.mouseDown(element)',
      filename: 'Mouse.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'mouseDown' }
      }],
      output: 'await fireEvent.mouseDown(element)'
    },
    {
      code: 'fireEvent.mouseUp(element)',
      filename: 'Mouse.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'mouseUp' }
      }],
      output: 'await fireEvent.mouseUp(element)'
    },

    // act with async callback not awaited
    {
      code: 'act(async () => { await doSomething() })',
      filename: 'Act.test.js',
      errors: [{
        messageId: 'missingAwaitAct'
      }],
      output: 'await act(async () => { await doSomething() })'
    },
    {
      code: 'act(async function() { return Promise.resolve() })',
      filename: 'Act.test.js',
      errors: [{
        messageId: 'missingAwaitAct'
      }],
      output: 'await act(async function() { return Promise.resolve() })'
    },

    // Playwright methods not awaited
    {
      code: 'page.click("#button")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'click' }
      }],
      output: 'await page.click("#button")'
    },
    {
      code: 'page.fill("#input", "text")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'fill' }
      }],
      output: 'await page.fill("#input", "text")'
    },
    {
      code: 'page.type("#input", "text")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'type' }
      }],
      output: 'await page.type("#input", "text")'
    },
    {
      code: 'page.goto("https://example.com")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'goto' }
      }],
      output: 'await page.goto("https://example.com")'
    },
    {
      code: 'page.reload()',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'reload' }
      }],
      output: 'await page.reload()'
    },
    {
      code: 'page.waitForSelector(".element")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'waitForSelector' }
      }],
      output: 'await page.waitForSelector(".element")'
    },
    {
      code: 'page.waitForTimeout(1000)',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'waitForTimeout' }
      }],
      output: 'await page.waitForTimeout(1000)'
    },
    {
      code: 'page.waitForLoadState("networkidle")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'waitForLoadState' }
      }],
      output: 'await page.waitForLoadState("networkidle")'
    },
    {
      code: 'page.screenshot()',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'screenshot' }
      }],
      output: 'await page.screenshot()'
    },

    // browser/context/frame methods not awaited
    {
      code: 'browser.newPage()',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'newPage' }
      }],
      output: 'await browser.newPage()'
    },
    {
      code: 'context.newPage()',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'newPage' }
      }],
      output: 'await context.newPage()'
    },
    {
      code: 'frame.click("#button")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'click' }
      }],
      output: 'await frame.click("#button")'
    },

    // Element methods not awaited
    {
      code: 'element.click()',
      filename: 'Element.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'await element.click()'
    },
    {
      code: 'button.click()',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'await button.click()'
    },
    {
      code: 'inputField.focus()',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'focus' }
      }],
      output: 'await inputField.focus()'
    },
    {
      code: 'inputElement.blur()',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'blur' }
      }],
      output: 'await inputElement.blur()'
    },
    {
      code: 'formElement.submit()',
      filename: 'Form.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'submit' }
      }],
      output: 'await formElement.submit()'
    },
    {
      code: 'getByRole("button").click()',
      filename: 'Query.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'await getByRole("button").click()'
    },
    {
      code: 'screen.getByText("Submit").click()',
      filename: 'Screen.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'await screen.getByText("Submit").click()'
    },
    {
      code: 'queryByTestId("submit-button").click()',
      filename: 'Query.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'await queryByTestId("submit-button").click()'
    },
    {
      code: 'findByLabelText("Email").type("test@example.com")',
      filename: 'Query.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'type' }
      }],
      output: 'await findByLabelText("Email").type("test@example.com")'
    },

    // Custom async methods not awaited
    {
      code: 'customAsyncMethod()',
      filename: 'Custom.test.js',
      options: [{ customAsyncMethods: ['customAsyncMethod'] }],
      errors: [{
        messageId: 'missingAwait',
        data: { method: 'customAsyncMethod' }
      }],
      output: 'await customAsyncMethod()'
    },
    {
      code: 'myAsyncHelper(data)',
      filename: 'Helper.test.js',
      options: [{ customAsyncMethods: ['myAsyncHelper', 'otherHelper'] }],
      errors: [{
        messageId: 'missingAwait',
        data: { method: 'myAsyncHelper' }
      }],
      output: 'await myAsyncHelper(data)'
    },

    // Multiple violations
    {
      code: `
        userEvent.click(button1);
        fireEvent.submit(form);
        page.goto("https://example.com");
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } },
        { messageId: 'missingAwaitFireEvent', data: { method: 'submit' } },
        { messageId: 'missingAwaitPage', data: { method: 'goto' } }
      ],
      output: `
        await userEvent.click(button1);
        await fireEvent.submit(form);
        await page.goto("https://example.com");
      `
    },

    // Complex expressions
    {
      code: '(condition && userEvent.click(button))',
      filename: 'Conditional.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'click' }
      }],
      output: '(condition && await userEvent.click(button))'
    },
    {
      code: 'condition ? userEvent.click(button1) : userEvent.click(button2)',
      filename: 'Ternary.test.js',
      errors: [
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } },
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } }
      ],
      output: 'condition ? await userEvent.click(button1) : await userEvent.click(button2)'
    }
  ]
});