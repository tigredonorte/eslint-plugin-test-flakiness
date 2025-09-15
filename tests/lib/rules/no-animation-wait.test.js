/**
 * @fileoverview Tests for no-animation-wait rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-animation-wait');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-animation-wait', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'waitForAnimation()',
      filename: 'src/app.js'
    },
    {
      code: 'element.waitFor("transitionend")',
      filename: 'src/animation.js'
    },

    // Other wait methods are fine
    {
      code: 'waitFor(() => expect(element).toBeVisible())',
      filename: 'Component.test.js'
    },
    {
      code: 'waitForElementToBeRemoved(() => screen.queryByText("Loading"))',
      filename: 'Loading.test.js'
    },
    {
      code: 'element.waitFor("load")',
      filename: 'Image.test.js'
    },
    {
      code: 'element.waitFor("click")',
      filename: 'Button.test.js'
    },

    // Different function names
    {
      code: 'waitForData()',
      filename: 'Data.test.js'
    },
    {
      code: 'waitForResponse()',
      filename: 'Api.test.js'
    },
    {
      code: 'myWaitForAnimation()',
      filename: 'Custom.test.js'
    },

    // waitFor with non-string argument
    {
      code: 'element.waitFor(callback)',
      filename: 'Callback.test.js'
    },
    {
      code: 'element.waitFor(EVENTS.LOAD)',
      filename: 'Constants.test.js'
    },
    {
      code: 'element.waitFor(eventName)',
      filename: 'Variable.test.js'
    },

    // Other method names on objects
    {
      code: 'animation.start()',
      filename: 'Animation.test.js'
    },
    {
      code: 'transition.end()',
      filename: 'Transition.test.js'
    }
  ],

  invalid: [
    // Direct waitForAnimation calls
    {
      code: 'waitForAnimation()',
      filename: 'Animation.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitForAnimations()',
      filename: 'Animations.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'await waitForAnimation()',
      filename: 'AsyncAnimation.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'await waitForAnimations()',
      filename: 'AsyncAnimations.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Waiting for transitionend event
    {
      code: 'element.waitFor("transitionend")',
      filename: 'Transition.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'await element.waitFor("transitionend")',
      filename: 'AsyncTransition.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'component.waitFor("transitionend")',
      filename: 'ComponentTransition.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Waiting for animationend event
    {
      code: 'element.waitFor("animationend")',
      filename: 'Animation.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'await element.waitFor("animationend")',
      filename: 'AsyncAnimation.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'modal.waitFor("animationend")',
      filename: 'Modal.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Different test file extensions
    {
      code: 'waitForAnimation()',
      filename: 'Animation.spec.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitForAnimations()',
      filename: 'test/animations.test.ts',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'element.waitFor("transitionend")',
      filename: '__tests__/transition.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Multiple violations
    {
      code: `
        waitForAnimation();
        element.waitFor("transitionend");
        component.waitFor("animationend");
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidAnimationWait' },
        { messageId: 'avoidAnimationWait' },
        { messageId: 'avoidAnimationWait' }
      ]
    },

    // In different contexts
    {
      code: 'beforeEach(() => waitForAnimation())',
      filename: 'Setup.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'it("should animate", async () => { await waitForAnimation(); })',
      filename: 'TestCase.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'return waitForAnimation()',
      filename: 'Return.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'const result = waitForAnimation()',
      filename: 'Variable.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // With arguments
    {
      code: 'waitForAnimation(element)',
      filename: 'ElementAnimation.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitForAnimations(elements, { timeout: 5000 })',
      filename: 'MultipleAnimations.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Chained calls
    {
      code: 'waitForAnimation().then(() => console.log("done"))',
      filename: 'Chained.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'element.waitFor("animationend").catch(handleError)',
      filename: 'ErrorHandling.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    }
  ]
});