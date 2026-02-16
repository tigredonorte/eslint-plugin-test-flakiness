/**
 * @fileoverview Tests for await-async-events rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/await-async-events');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

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
      code: 'async function test() { await userEvent.click(button) }',
      filename: 'Component.test.js'
    },
    {
      code: 'async function test() { await userEvent.type(input, "text") }',
      filename: 'Input.test.js'
    },
    {
      code: 'async function test() { await userEvent.clear(input) }',
      filename: 'Form.test.js'
    },
    {
      code: 'async function test() { await userEvent.selectOptions(select, "option1") }',
      filename: 'Select.test.js'
    },
    {
      code: 'async function test() { await userEvent.hover(element) }',
      filename: 'Hover.test.js'
    },
    {
      code: 'async function test() { await userEvent.unhover(element) }',
      filename: 'Hover.test.js'
    },
    {
      code: 'async function test() { await userEvent.upload(input, file) }',
      filename: 'Upload.test.js'
    },
    {
      code: 'async function test() { await userEvent.tab() }',
      filename: 'Navigation.test.js'
    },
    {
      code: 'async function test() { await userEvent.paste(input, "text") }',
      filename: 'Clipboard.test.js'
    },
    {
      code: 'async function test() { await userEvent.keyboard("[Enter]") }',
      filename: 'Keyboard.test.js'
    },

    // Properly awaited fireEvent methods
    {
      code: 'async function test() { await fireEvent.click(button) }',
      filename: 'Button.test.js'
    },
    {
      code: 'async function test() { await fireEvent.change(input, { target: { value: "test" } }) }',
      filename: 'Input.test.js'
    },
    {
      code: 'async function test() { await fireEvent.submit(form) }',
      filename: 'Form.test.js'
    },
    {
      code: 'async function test() { await fireEvent.focus(input) }',
      filename: 'Focus.test.js'
    },
    {
      code: 'async function test() { await fireEvent.blur(input) }',
      filename: 'Blur.test.js'
    },
    {
      code: 'async function test() { await fireEvent.keyDown(input, { key: "Enter" }) }',
      filename: 'Keyboard.test.js'
    },

    // Returned promises
    {
      code: 'async function test() { return userEvent.click(button) }',
      filename: 'Return.test.js'
    },
    {
      code: 'async function test() { return fireEvent.click(button) }',
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

    // expect().rejects / expect().resolves (Problem 3 fix)
    {
      code: 'async function test() { await expect(userEvent.click(button)).rejects.toThrow() }',
      filename: 'Rejects.test.js'
    },
    {
      code: 'async function test() { await expect(userEvent.type(input, "text")).resolves.toBeDefined() }',
      filename: 'Resolves.test.js'
    },

    // Properly awaited act with async callback
    {
      code: 'async function test() { await act(async () => { await doSomething() }) }',
      filename: 'Act.test.js'
    },
    {
      code: 'async function test() { return act(async () => { await doSomething() }) }',
      filename: 'Act.test.js'
    },

    // act with sync callback doesn't need await
    {
      code: 'act(() => { doSomething() })',
      filename: 'Act.test.js'
    },

    // Playwright - properly awaited
    {
      code: 'async function test() { await page.click("#button") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.fill("#input", "text") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.type("#input", "text") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.press("body", "Enter") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.check("#checkbox") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.selectOption("#select", "option1") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.goto("https://example.com") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.reload() }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.waitForSelector(".element") }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await page.screenshot() }',
      filename: 'playwright.spec.js'
    },

    // Browser/context/frame methods
    {
      code: 'async function test() { await browser.newPage() }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await context.newPage() }',
      filename: 'playwright.spec.js'
    },
    {
      code: 'async function test() { await frame.click("#button") }',
      filename: 'playwright.spec.js'
    },

    // Element methods - properly awaited
    {
      code: 'async function test() { await element.click() }',
      filename: 'Element.test.js'
    },
    {
      code: 'async function test() { await button.focus() }',
      filename: 'Button.test.js'
    },
    {
      code: 'async function test() { await inputField.blur() }',
      filename: 'Input.test.js'
    },
    {
      code: 'async function test() { await formElement.submit() }',
      filename: 'Form.test.js'
    },
    {
      code: 'async function test() { await getByRole("button").click() }',
      filename: 'Query.test.js'
    },
    {
      code: 'async function test() { await screen.getByText("Submit").click() }',
      filename: 'Screen.test.js'
    },

    // Custom async methods with configuration
    {
      code: 'async function test() { await customAsyncMethod() }',
      filename: 'Custom.test.js',
      options: [{ customAsyncMethods: ['customAsyncMethod'] }]
    },
    {
      code: 'async function test() { return customAsyncMethod() }',
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
    },
    // userEvent v14+ pattern - properly awaited
    {
      code: 'async function test() { const user = userEvent.setup(); await user.click(button) }',
      filename: 'UserEventV14.test.js'
    },
    {
      code: 'async function test() { const user = userEvent.setup(); await user.type(input, "text") }',
      filename: 'UserEventV14.test.js'
    },
    {
      code: 'async function test() { const user = await userEvent.setup(); await user.click(button) }',
      filename: 'UserEventV14.test.js'
    },
    {
      code: 'async function test() { const userInstance = userEvent.setup(); await userInstance.hover(element) }',
      filename: 'UserEventV14.test.js'
    },
    // userEvent v14+ pattern - returned promise
    {
      code: 'async function test() { const user = userEvent.setup(); return user.click(button) }',
      filename: 'UserEventV14.test.js'
    },
    // userEvent v14+ pattern - promise chain
    {
      code: 'const user = userEvent.setup(); user.click(button).then(() => {})',
      filename: 'UserEventV14.test.js'
    },
    // userEvent v14+ pattern - assigned to variable
    {
      code: 'const user = userEvent.setup(); const promise = user.click(button)',
      filename: 'UserEventV14.test.js'
    },
    // Variables not from userEvent.setup() shouldn't be tracked
    {
      code: 'const user = getSomeUser(); user.click(button)',
      filename: 'NotUserEvent.test.js'
    }
  ],

  invalid: [
    // userEvent methods without await
    {
      code: 'async function test() { userEvent.click(button) }',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'click' }
      }],
      output: 'async function test() { await userEvent.click(button) }'
    },
    {
      code: 'async function test() { userEvent.dblClick(button) }',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'dblClick' }
      }],
      output: 'async function test() { await userEvent.dblClick(button) }'
    },
    {
      code: 'async function test() { userEvent.tripleClick(button) }',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'tripleClick' }
      }],
      output: 'async function test() { await userEvent.tripleClick(button) }'
    },
    {
      code: 'async function test() { userEvent.type(input, "text") }',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'type' }
      }],
      output: 'async function test() { await userEvent.type(input, "text") }'
    },
    {
      code: 'async function test() { userEvent.clear(input) }',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'clear' }
      }],
      output: 'async function test() { await userEvent.clear(input) }'
    },
    {
      code: 'async function test() { userEvent.selectOptions(select, "option1") }',
      filename: 'Select.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'selectOptions' }
      }],
      output: 'async function test() { await userEvent.selectOptions(select, "option1") }'
    },
    {
      code: 'async function test() { userEvent.deselectOptions(select, "option1") }',
      filename: 'Select.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'deselectOptions' }
      }],
      output: 'async function test() { await userEvent.deselectOptions(select, "option1") }'
    },
    {
      code: 'async function test() { userEvent.upload(input, file) }',
      filename: 'Upload.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'upload' }
      }],
      output: 'async function test() { await userEvent.upload(input, file) }'
    },
    {
      code: 'async function test() { userEvent.tab() }',
      filename: 'Navigation.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'tab' }
      }],
      output: 'async function test() { await userEvent.tab() }'
    },
    {
      code: 'async function test() { userEvent.hover(element) }',
      filename: 'Hover.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'hover' }
      }],
      output: 'async function test() { await userEvent.hover(element) }'
    },
    {
      code: 'async function test() { userEvent.unhover(element) }',
      filename: 'Hover.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'unhover' }
      }],
      output: 'async function test() { await userEvent.unhover(element) }'
    },
    {
      code: 'async function test() { userEvent.paste(input, "text") }',
      filename: 'Clipboard.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'paste' }
      }],
      output: 'async function test() { await userEvent.paste(input, "text") }'
    },
    {
      code: 'async function test() { userEvent.keyboard("[Enter]") }',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'keyboard' }
      }],
      output: 'async function test() { await userEvent.keyboard("[Enter]") }'
    },

    // fireEvent methods without await
    {
      code: 'async function test() { fireEvent.click(button) }',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'click' }
      }],
      output: 'async function test() { await fireEvent.click(button) }'
    },
    {
      code: 'async function test() { fireEvent.change(input, { target: { value: "test" } }) }',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'change' }
      }],
      output: 'async function test() { await fireEvent.change(input, { target: { value: "test" } }) }'
    },
    {
      code: 'async function test() { fireEvent.input(input, { target: { value: "test" } }) }',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'input' }
      }],
      output: 'async function test() { await fireEvent.input(input, { target: { value: "test" } }) }'
    },
    {
      code: 'async function test() { fireEvent.submit(form) }',
      filename: 'Form.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'submit' }
      }],
      output: 'async function test() { await fireEvent.submit(form) }'
    },
    {
      code: 'async function test() { fireEvent.focus(input) }',
      filename: 'Focus.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'focus' }
      }],
      output: 'async function test() { await fireEvent.focus(input) }'
    },
    {
      code: 'async function test() { fireEvent.blur(input) }',
      filename: 'Blur.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'blur' }
      }],
      output: 'async function test() { await fireEvent.blur(input) }'
    },
    {
      code: 'async function test() { fireEvent.keyDown(input, { key: "Enter" }) }',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'keyDown' }
      }],
      output: 'async function test() { await fireEvent.keyDown(input, { key: "Enter" }) }'
    },
    {
      code: 'async function test() { fireEvent.keyUp(input, { key: "Enter" }) }',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'keyUp' }
      }],
      output: 'async function test() { await fireEvent.keyUp(input, { key: "Enter" }) }'
    },
    {
      code: 'async function test() { fireEvent.keyPress(input, { key: "a" }) }',
      filename: 'Keyboard.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'keyPress' }
      }],
      output: 'async function test() { await fireEvent.keyPress(input, { key: "a" }) }'
    },
    {
      code: 'async function test() { fireEvent.mouseDown(element) }',
      filename: 'Mouse.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'mouseDown' }
      }],
      output: 'async function test() { await fireEvent.mouseDown(element) }'
    },
    {
      code: 'async function test() { fireEvent.mouseUp(element) }',
      filename: 'Mouse.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'mouseUp' }
      }],
      output: 'async function test() { await fireEvent.mouseUp(element) }'
    },

    // act with async callback not awaited
    {
      code: 'async function test() { act(async () => { await doSomething() }) }',
      filename: 'Act.test.js',
      errors: [{
        messageId: 'missingAwaitAct'
      }],
      output: 'async function test() { await act(async () => { await doSomething() }) }'
    },
    {
      code: 'async function test() { act(async function() { return Promise.resolve() }) }',
      filename: 'Act.test.js',
      errors: [{
        messageId: 'missingAwaitAct'
      }],
      output: 'async function test() { await act(async function() { return Promise.resolve() }) }'
    },

    // Playwright methods not awaited
    {
      code: 'async function test() { page.click("#button") }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'click' }
      }],
      output: 'async function test() { await page.click("#button") }'
    },
    {
      code: 'async function test() { page.fill("#input", "text") }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'fill' }
      }],
      output: 'async function test() { await page.fill("#input", "text") }'
    },
    {
      code: 'async function test() { page.type("#input", "text") }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'type' }
      }],
      output: 'async function test() { await page.type("#input", "text") }'
    },
    {
      code: 'async function test() { page.goto("https://example.com") }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'goto' }
      }],
      output: 'async function test() { await page.goto("https://example.com") }'
    },
    {
      code: 'async function test() { page.reload() }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'reload' }
      }],
      output: 'async function test() { await page.reload() }'
    },
    {
      code: 'async function test() { page.waitForSelector(".element") }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'waitForSelector' }
      }],
      output: 'async function test() { await page.waitForSelector(".element") }'
    },
    {
      code: 'async function test() { page.waitForTimeout(1000) }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'waitForTimeout' }
      }],
      output: 'async function test() { await page.waitForTimeout(1000) }'
    },
    {
      code: 'async function test() { page.waitForLoadState("networkidle") }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'waitForLoadState' }
      }],
      output: 'async function test() { await page.waitForLoadState("networkidle") }'
    },
    {
      code: 'async function test() { page.screenshot() }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'screenshot' }
      }],
      output: 'async function test() { await page.screenshot() }'
    },

    // browser/context/frame methods not awaited
    {
      code: 'async function test() { browser.newPage() }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'newPage' }
      }],
      output: 'async function test() { await browser.newPage() }'
    },
    {
      code: 'async function test() { context.newPage() }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'newPage' }
      }],
      output: 'async function test() { await context.newPage() }'
    },
    {
      code: 'async function test() { frame.click("#button") }',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'click' }
      }],
      output: 'async function test() { await frame.click("#button") }'
    },

    // Element methods not awaited
    {
      code: 'async function test() { element.click() }',
      filename: 'Element.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'async function test() { await element.click() }'
    },
    {
      code: 'async function test() { button.click() }',
      filename: 'Button.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'async function test() { await button.click() }'
    },
    {
      code: 'async function test() { inputField.focus() }',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'focus' }
      }],
      output: 'async function test() { await inputField.focus() }'
    },
    {
      code: 'async function test() { inputElement.blur() }',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'blur' }
      }],
      output: 'async function test() { await inputElement.blur() }'
    },
    {
      code: 'async function test() { formElement.submit() }',
      filename: 'Form.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'submit' }
      }],
      output: 'async function test() { await formElement.submit() }'
    },
    {
      code: 'async function test() { getByRole("button").click() }',
      filename: 'Query.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'async function test() { await getByRole("button").click() }'
    },
    {
      code: 'async function test() { screen.getByText("Submit").click() }',
      filename: 'Screen.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'async function test() { await screen.getByText("Submit").click() }'
    },
    {
      code: 'async function test() { queryByTestId("submit-button").click() }',
      filename: 'Query.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'click' }
      }],
      output: 'async function test() { await queryByTestId("submit-button").click() }'
    },
    {
      code: 'async function test() { findByLabelText("Email").type("test@example.com") }',
      filename: 'Query.test.js',
      errors: [{
        messageId: 'missingAwaitElement',
        data: { method: 'type' }
      }],
      output: 'async function test() { await findByLabelText("Email").type("test@example.com") }'
    },

    // Custom async methods not awaited
    {
      code: 'async function test() { customAsyncMethod() }',
      filename: 'Custom.test.js',
      options: [{ customAsyncMethods: ['customAsyncMethod'] }],
      errors: [{
        messageId: 'missingAwait',
        data: { method: 'customAsyncMethod' }
      }],
      output: 'async function test() { await customAsyncMethod() }'
    },
    {
      code: 'async function test() { myAsyncHelper(data) }',
      filename: 'Helper.test.js',
      options: [{ customAsyncMethods: ['myAsyncHelper', 'otherHelper'] }],
      errors: [{
        messageId: 'missingAwait',
        data: { method: 'myAsyncHelper' }
      }],
      output: 'async function test() { await myAsyncHelper(data) }'
    },

    // userEvent v14+ pattern violations
    {
      code: 'async function test() { const user = userEvent.setup(); user.click(button) }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'click' }
      }],
      output: 'async function test() { const user = userEvent.setup(); await user.click(button) }'
    },
    {
      code: 'async function test() { const user = userEvent.setup(); user.type(input, "text") }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'type' }
      }],
      output: 'async function test() { const user = userEvent.setup(); await user.type(input, "text") }'
    },
    {
      code: 'async function test() { const user = await userEvent.setup(); user.click(button) }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'click' }
      }],
      output: 'async function test() { const user = await userEvent.setup(); await user.click(button) }'
    },
    {
      code: 'async function test() { const userInstance = userEvent.setup(); userInstance.dblClick(button) }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'dblClick' }
      }],
      output: 'async function test() { const userInstance = userEvent.setup(); await userInstance.dblClick(button) }'
    },
    {
      code: 'async function test() { const user = userEvent.setup(); user.clear(input) }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'clear' }
      }],
      output: 'async function test() { const user = userEvent.setup(); await user.clear(input) }'
    },
    {
      code: 'async function test() { const user = userEvent.setup(); user.selectOptions(select, "option") }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'selectOptions' }
      }],
      output: 'async function test() { const user = userEvent.setup(); await user.selectOptions(select, "option") }'
    },
    {
      code: 'async function test() { const user = userEvent.setup(); user.hover(element) }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'hover' }
      }],
      output: 'async function test() { const user = userEvent.setup(); await user.hover(element) }'
    },
    {
      code: 'async function test() { const user = userEvent.setup(); user.tab() }',
      filename: 'UserEventV14.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'tab' }
      }],
      output: 'async function test() { const user = userEvent.setup(); await user.tab() }'
    },

    // Non-async function should be made async (Problem 1 fix)
    {
      code: 'function test() { userEvent.click(button) }',
      filename: 'NonAsync.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'click' }
      }],
      output: 'async function test() { await userEvent.click(button) }'
    },
    {
      code: 'const test = () => { fireEvent.click(button) }',
      filename: 'NonAsync.test.js',
      errors: [{
        messageId: 'missingAwaitFireEvent',
        data: { method: 'click' }
      }],
      output: 'const test = async () => { await fireEvent.click(button) }'
    },
    {
      code: 'function test() { act(async () => { await doSomething() }) }',
      filename: 'NonAsync.test.js',
      errors: [{
        messageId: 'missingAwaitAct'
      }],
      output: 'async function test() { await act(async () => { await doSomething() }) }'
    },
    {
      code: 'function test() { page.click("#button") }',
      filename: 'NonAsync.spec.js',
      errors: [{
        messageId: 'missingAwaitPage',
        data: { method: 'click' }
      }],
      output: 'async function test() { await page.click("#button") }'
    },

    // Multiple violations
    {
      code: `async function test() {
        userEvent.click(button1);
        fireEvent.submit(form);
        page.goto("https://example.com");
      }`,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } },
        { messageId: 'missingAwaitFireEvent', data: { method: 'submit' } },
        { messageId: 'missingAwaitPage', data: { method: 'goto' } }
      ],
      output: `async function test() {
        await userEvent.click(button1);
        await fireEvent.submit(form);
        await page.goto("https://example.com");
      }`
    },

    // Complex expressions
    {
      code: 'async function test() { (condition && userEvent.click(button)) }',
      filename: 'Conditional.test.js',
      errors: [{
        messageId: 'missingAwaitUserEvent',
        data: { method: 'click' }
      }],
      output: 'async function test() { (condition && await userEvent.click(button)) }'
    },
    {
      code: 'async function test() { condition ? userEvent.click(button1) : userEvent.click(button2) }',
      filename: 'Ternary.test.js',
      errors: [
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } },
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } }
      ],
      output: 'async function test() { condition ? await userEvent.click(button1) : await userEvent.click(button2) }'
    },

    // Mixed userEvent v14+ and direct calls
    {
      code: `async function test() {
const user = userEvent.setup();
user.click(button1);
userEvent.click(button2);
user.type(input, "text");
}`,
      filename: 'MixedPatterns.test.js',
      errors: [
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } },
        { messageId: 'missingAwaitUserEvent', data: { method: 'click' } },
        { messageId: 'missingAwaitUserEvent', data: { method: 'type' } }
      ],
      output: `async function test() {
const user = userEvent.setup();
await user.click(button1);
await userEvent.click(button2);
await user.type(input, "text");
}`
    }
  ]
});

// Unit tests for helper functions
describe('await-async-events rule internals', () => {
  it('should export a rule object', () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeDefined();
  });

  it('should have correct meta information', () => {
    expect(rule.meta.type).toBe('problem');
    expect(rule.meta.docs.description).toBe('Enforce awaiting async user events and actions');
    expect(rule.meta.fixable).toBe('code');
    expect(rule.meta.messages).toHaveProperty('missingAwait');
    expect(rule.meta.messages).toHaveProperty('missingAwaitFireEvent');
    expect(rule.meta.messages).toHaveProperty('missingAwaitUserEvent');
    expect(rule.meta.messages).toHaveProperty('missingAwaitAct');
    expect(rule.meta.messages).toHaveProperty('missingAwaitPage');
    expect(rule.meta.messages).toHaveProperty('missingAwaitElement');
  });

  it('should have schema with correct options', () => {
    expect(rule.meta.schema).toHaveLength(1);
    expect(rule.meta.schema[0].type).toBe('object');
    expect(rule.meta.schema[0].properties).toHaveProperty('customAsyncMethods');
    expect(rule.meta.schema[0].properties.customAsyncMethods.type).toBe('array');
    expect(rule.meta.schema[0].properties.customAsyncMethods.default).toEqual([]);
  });

  it('should return empty object for non-test files', () => {
    const context = {
      options: [],
      filename: 'app.js',
      getFilename: () => 'app.js',
      getPhysicalFilename: () => 'app.js',
      report: jest.fn()
    };

    const visitor = rule.create(context);
    expect(visitor).toEqual({});
  });

  it('should create proper visitor for test files', () => {
    const context = {
      options: [],
      filename: 'test.spec.js',
      getFilename: () => 'test.spec.js',
      getPhysicalFilename: () => 'test.spec.js',
      report: jest.fn(),
      getSourceCode: () => ({
        getText: () => 'code'
      })
    };

    const visitor = rule.create(context);
    expect(visitor).toBeDefined();
    expect(visitor.CallExpression).toBeDefined();
  });

  describe('Edge cases', () => {
    it('should handle CallExpression without callee properties', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {},
        arguments: [],
        parent: null
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle MemberExpression without object name', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {},
          property: { name: 'click' }
        },
        arguments: [],
        parent: null
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle act without callback', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: { name: 'act' },
        arguments: [],
        parent: null
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle empty options', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      expect(visitor).toBeDefined();
    });

    it('should handle options without customAsyncMethods', () => {
      const context = {
        options: [{}],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'code'
        })
      };

      const visitor = rule.create(context);
      expect(visitor).toBeDefined();
    });

    it('should handle parent types correctly', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => 'userEvent.click'
        })
      };

      const visitor = rule.create(context);

      // Test AwaitExpression parent
      const nodeWithAwait = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'userEvent' },
          property: { name: 'click' }
        },
        parent: { type: 'AwaitExpression' }
      };

      visitor.CallExpression(nodeWithAwait);
      expect(context.report).not.toHaveBeenCalled();

      // Test ReturnStatement parent
      const nodeWithReturn = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'userEvent' },
          property: { name: 'click' }
        },
        parent: { type: 'ReturnStatement' }
      };

      visitor.CallExpression(nodeWithReturn);
      expect(context.report).not.toHaveBeenCalled();

      // Test MemberExpression parent with then
      const nodeWithThen = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'userEvent' },
          property: { name: 'click' }
        },
        parent: {
          type: 'MemberExpression',
          property: { name: 'then' },
          parent: { type: 'CallExpression' }
        }
      };

      visitor.CallExpression(nodeWithThen);
      expect(context.report).not.toHaveBeenCalled();

      // Test MemberExpression parent with catch
      const nodeWithCatch = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'userEvent' },
          property: { name: 'click' }
        },
        parent: {
          type: 'MemberExpression',
          property: { name: 'catch' },
          parent: { type: 'CallExpression' }
        }
      };

      visitor.CallExpression(nodeWithCatch);
      expect(context.report).not.toHaveBeenCalled();

      // Test VariableDeclarator parent
      const nodeWithVariable = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'userEvent' },
          property: { name: 'click' }
        },
        parent: { type: 'VariableDeclarator' }
      };

      visitor.CallExpression(nodeWithVariable);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle custom async methods with non-Identifier callee', () => {
      const context = {
        options: [{ customAsyncMethods: ['customMethod'] }],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'obj' },
          property: { name: 'customMethod' }
        },
        parent: null
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle element patterns in object text', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn(),
        getSourceCode: () => ({
          getText: (node) => {
            if (node.name === 'submitButton') return 'submitButton';
            if (node.name === 'inputElement') return 'inputElement';
            if (node.name === 'radioOption') return 'radioOption';
            if (node.name === 'checkboxField') return 'checkboxField';
            if (node.name === 'linkItem') return 'linkItem';
            if (node.expression === 'getByRole("button")') return 'getByRole("button")';
            if (node.expression === 'queryByTestId("field")') return 'queryByTestId("field")';
            if (node.expression === 'findByText("Submit")') return 'findByText("Submit")';
            if (node.expression === 'screen.getByLabelText("Name")') return 'screen.getByLabelText("Name")';
            return 'someObject';
          }
        })
      };

      const visitor = rule.create(context);

      // Test various element patterns
      const testCases = [
        { name: 'submitButton', shouldReport: true },
        { name: 'inputElement', shouldReport: true },
        { name: 'radioOption', shouldReport: true },
        { name: 'checkboxField', shouldReport: true },
        { name: 'linkItem', shouldReport: true },
        { expression: 'getByRole("button")', shouldReport: true },
        { expression: 'queryByTestId("field")', shouldReport: true },
        { expression: 'findByText("Submit")', shouldReport: true },
        { expression: 'screen.getByLabelText("Name")', shouldReport: true },
        { name: 'someObject', shouldReport: false }
      ];

      testCases.forEach(test => {
        context.report.mockClear();
        const node = {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: test.name ? { name: test.name } : { expression: test.expression },
            property: { name: 'click' }
          },
          parent: null
        };

        visitor.CallExpression(node);
        if (test.shouldReport) {
          expect(context.report).toHaveBeenCalled();
        } else {
          expect(context.report).not.toHaveBeenCalled();
        }
      });
    });

    it('should handle ArrowFunctionExpression in act', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);

      // Test async arrow function
      const nodeAsyncArrow = {
        type: 'CallExpression',
        callee: { name: 'act' },
        arguments: [{
          type: 'ArrowFunctionExpression',
          async: true
        }],
        parent: null
      };

      visitor.CallExpression(nodeAsyncArrow);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'missingAwaitAct'
        })
      );

      // Test non-async arrow function
      context.report.mockClear();
      const nodeNonAsyncArrow = {
        type: 'CallExpression',
        callee: { name: 'act' },
        arguments: [{
          type: 'ArrowFunctionExpression',
          async: false
        }],
        parent: null
      };

      visitor.CallExpression(nodeNonAsyncArrow);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle FunctionExpression in act', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);

      // Test async function expression
      const nodeAsyncFunc = {
        type: 'CallExpression',
        callee: { name: 'act' },
        arguments: [{
          type: 'FunctionExpression',
          async: true
        }],
        parent: null
      };

      visitor.CallExpression(nodeAsyncFunc);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'missingAwaitAct'
        })
      );

      // Test non-async function expression
      context.report.mockClear();
      const nodeNonAsyncFunc = {
        type: 'CallExpression',
        callee: { name: 'act' },
        arguments: [{
          type: 'FunctionExpression',
          async: false
        }],
        parent: null
      };

      visitor.CallExpression(nodeNonAsyncFunc);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle async property directly on callback', () => {
      const context = {
        options: [],
        filename: 'test.spec.js',
        getFilename: () => 'test.spec.js',
        getPhysicalFilename: () => 'test.spec.js',
        report: jest.fn()
      };

      const visitor = rule.create(context);

      const nodeWithAsync = {
        type: 'CallExpression',
        callee: { name: 'act' },
        arguments: [{
          async: true,
          type: 'SomeOtherType'
        }],
        parent: null
      };

      visitor.CallExpression(nodeWithAsync);
      expect(context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'missingAwaitAct'
        })
      );
    });
  });
});