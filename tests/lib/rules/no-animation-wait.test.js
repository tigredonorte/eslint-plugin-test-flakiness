/**
 * @fileoverview Tests for no-animation-wait rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-animation-wait');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

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
    },

    // Configuration: allowAnimationFrame
    {
      code: 'requestAnimationFrame(callback)',
      filename: 'Animation.test.js',
      options: [{ allowAnimationFrame: true }]
    },
    {
      code: 'window.requestAnimationFrame(callback)',
      filename: 'Animation.test.js',
      options: [{ allowAnimationFrame: true }]
    },

    // Configuration: allowIfAnimationsDisabled (animations are disabled)
    {
      code: `
        // animation-duration: 0s !important;
        waitForAnimation()
      `,
      filename: 'Animation.test.js',
      options: [{ allowIfAnimationsDisabled: true }]
    },
    {
      code: `
        const styles = \`* { transition-duration: 0 !important; }\`;
        waitForTransition()
      `,
      filename: 'Transition.test.js',
      options: [{ allowIfAnimationsDisabled: true }]
    },
    {
      code: `
        disableAnimations();
        element.waitFor("transitionend")
      `,
      filename: 'Setup.test.js',
      options: [{ allowIfAnimationsDisabled: true }]
    },

    // Configuration: ignorePatterns
    {
      code: 'waitForAnimation()',
      filename: 'Animation.test.js',
      options: [{ ignorePatterns: ['waitForAnimation'] }]
    },
    {
      code: 'element.waitFor("transitionend")',
      filename: 'Transition.test.js',
      options: [{ ignorePatterns: ['transitionend'] }]
    },

    // waitFor with non-animation assertions
    {
      code: 'waitFor(() => expect(element).toBeInTheDocument())',
      filename: 'Presence.test.js'
    },
    {
      code: 'waitFor(() => expect(element).toHaveTextContent("Done"))',
      filename: 'Content.test.js'
    },

    // page.waitForTimeout without animation comment
    {
      code: `
        // Wait for network request
        page.waitForTimeout(1000)
      `,
      filename: 'Network.test.js'
    },

    // Regular Cypress commands
    {
      code: 'cy.wait(1000)',
      filename: 'Cypress.test.js'
    },
    {
      code: 'cy.get(".element")',
      filename: 'Cypress.test.js'
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
      code: 'async function test() { await waitForAnimation() }',
      filename: 'AsyncAnimation.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'async function test() { await waitForAnimations() }',
      filename: 'AsyncAnimations.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // New patterns: waitForTransition
    {
      code: 'waitForTransition()',
      filename: 'Transition.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitForTransitions()',
      filename: 'Transitions.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitForCSSAnimation()',
      filename: 'CSS.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitForCSSTransition()',
      filename: 'CSS.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Waiting for transitionend event
    {
      code: 'element.waitFor("transitionend")',
      filename: 'Transition.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'async function test() { await element.waitFor("transitionend") }',
      filename: 'AsyncTransition.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'component.waitFor("transitionend")',
      filename: 'ComponentTransition.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },

    // Waiting for animationend event
    {
      code: 'element.waitFor("animationend")',
      filename: 'Animation.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'async function test() { await element.waitFor("animationend") }',
      filename: 'AsyncAnimation.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'modal.waitFor("animationend")',
      filename: 'Modal.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },

    // New vendor-prefixed events
    {
      code: 'element.waitFor("webkitTransitionEnd")',
      filename: 'WebkitTransition.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("webkitAnimationEnd")',
      filename: 'WebkitAnimation.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("oTransitionEnd")',
      filename: 'OperaTransition.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("msAnimationEnd")',
      filename: 'MSAnimation.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("mozTransitionEnd")',
      filename: 'MozTransition.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },

    // New animation events
    {
      code: 'element.waitFor("transitionstart")',
      filename: 'TransitionStart.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("animationstart")',
      filename: 'AnimationStart.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("transitioncancel")',
      filename: 'TransitionCancel.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("animationiteration")',
      filename: 'AnimationIteration.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },

    // requestAnimationFrame (without allowAnimationFrame)
    {
      code: 'requestAnimationFrame(callback)',
      filename: 'Animation.test.js',
      errors: [{
        messageId: 'avoidAnimationFrame'
      }]
    },
    {
      code: 'window.requestAnimationFrame(callback)',
      filename: 'Animation.test.js',
      errors: [{
        messageId: 'avoidAnimationFrame'
      }]
    },

    // Playwright-specific with animation comment
    {
      code: `
        // Wait for fade animation
        page.waitForTimeout(500)
      `,
      filename: 'Playwright.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: `
        // Wait for slide transition
        frame.waitForTimeout(300)
      `,
      filename: 'Playwright.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Cypress animation commands
    {
      code: 'cy.waitForAnimations()',
      filename: 'Cypress.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'cy.waitForAnimation()',
      filename: 'Cypress.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'cy.ensureAnimations()',
      filename: 'Cypress.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // testing-library waitFor with animation assertions
    {
      code: 'waitFor(() => expect(element).toHaveStyle({ opacity: "1" }))',
      filename: 'Opacity.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitFor(() => expect(element).toHaveClass("fade-in"))',
      filename: 'FadeIn.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitFor(() => expect(element).toHaveClass("slide-up"))',
      filename: 'SlideUp.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitFor(() => expect(element).toHaveClass("collapse-transition"))',
      filename: 'Collapse.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Custom patterns via configuration
    {
      code: 'myCustomAnimationWait()',
      filename: 'Custom.test.js',
      options: [{ customAnimationPatterns: ['myCustomAnimationWait'] }],
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // allowIfAnimationsDisabled: false (should still report even with disabled animations)
    {
      code: `
        // animation-duration: 0s !important;
        waitForAnimation()
      `,
      filename: 'Animation.test.js',
      options: [{ allowIfAnimationsDisabled: false }],
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Case-insensitive event names
    {
      code: 'element.waitFor("TransitionEnd")',
      filename: 'CaseInsensitive.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.waitFor("ANIMATIONEND")',
      filename: 'Uppercase.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
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
      filename: '__tests__/transition.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
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
        { messageId: 'avoidTransitionWait' },
        { messageId: 'avoidTransitionWait' }
      ]
    },

    // addEventListener with animation events
    {
      code: 'element.addEventListener("transitionend", handler)',
      filename: 'EventListener.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.addEventListener("animationend", callback)',
      filename: 'AnimationListener.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'div.addEventListener("webkitAnimationEnd", onAnimationEnd)',
      filename: 'WebkitListener.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.addEventListener("transitioncancel", handler)',
      filename: 'TransitionCancel.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },
    {
      code: 'element.addEventListener("animationiteration", handler)',
      filename: 'AnimationIteration.test.js',
      errors: [{
        messageId: 'avoidTransitionWait'
      }]
    },

    // jQuery animation methods with callbacks
    {
      code: '$element.fadeIn(500, function() { done(); })',
      filename: 'JQueryFade.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: '$element.slideUp(300, () => callback())',
      filename: 'JQuerySlide.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: '$modal.animate({ opacity: 0 }, 400, function() { onComplete(); })',
      filename: 'JQueryAnimate.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'element.fadeOut("slow", function() { /* done */ })',
      filename: 'JQueryFadeOut.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Velocity.js animation callbacks
    {
      code: 'Velocity(element, { opacity: 1 }, { complete: onComplete })',
      filename: 'Velocity.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'Velocity.animate(element, { left: "100px" }, { duration: 500, complete: callback })',
      filename: 'VelocityAnimate.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // GSAP/TweenMax animation callbacks
    {
      code: 'TweenMax.to(element, 1, { x: 100, onComplete: done })',
      filename: 'TweenMax.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'gsap.from(element, { duration: 2, y: -50, onStart: startHandler })',
      filename: 'GSAP.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'TweenLite.fromTo(element, 0.5, { opacity: 0 }, { opacity: 1, onUpdate: updateHandler })',
      filename: 'TweenLite.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'TimelineMax.to(element, 1, { scale: 2, onRepeat: repeatHandler })',
      filename: 'TimelineMax.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'TimelineLite.set(element, { x: 100, onReverseComplete: reverseComplete })',
      filename: 'TimelineLite.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Framer Motion animation callbacks
    {
      code: 'await controls.start({ x: 100 })',
      filename: 'FramerMotion.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'await useAnimation().start({ scale: 1.5 })',
      filename: 'FramerMotionHook.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Playwright waitForSelector with visible state
    {
      code: 'await page.waitForSelector(".modal", { state: "visible" })',
      filename: 'PlaywrightVisible.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'await frame.waitForSelector("#popup", { state: "visible" })',
      filename: 'PlaywrightFrame.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // React Spring animation states in waitFor
    {
      code: 'waitFor(() => expect(element.animating).toBe(false))',
      filename: 'ReactSpring.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitFor(() => expect(isAnimating).toBeFalsy())',
      filename: 'AnimatingState.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'waitFor(() => expect(spring.getValue()).toBeCloseTo(100))',
      filename: 'SpringValue.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },

    // Web Animations API .finished property
    {
      code: 'await animation.finished',
      filename: 'WebAnimationAPI.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
    },
    {
      code: 'animation.finished.then(onAnimationComplete)',
      filename: 'WebAnimationThen.test.js',
      errors: [{
        messageId: 'avoidAnimationWait'
      }]
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
      code: 'function test() { return waitForAnimation() }',
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
        messageId: 'avoidTransitionWait'
      }]
    }
  ]
});

// Unit tests for helper functions and edge cases
describe('no-animation-wait rule internals', () => {
  it('should export a rule object', () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeDefined();
  });

  it('should have correct meta information', () => {
    expect(rule.meta.type).toBe('problem');
    expect(rule.meta.docs.description).toBe('Avoid waiting for animations which can have variable timing');
    expect(rule.meta.docs.category).toBe('Best Practices');
    expect(rule.meta.docs.recommended).toBe(true);
    expect(rule.meta.docs.url).toBe('https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-animation-wait.md');
    expect(rule.meta.fixable).toBe(null);
    expect(rule.meta.messages).toHaveProperty('avoidAnimationWait');
    expect(rule.meta.messages).toHaveProperty('avoidTransitionWait');
    expect(rule.meta.messages).toHaveProperty('avoidAnimationFrame');
  });

  it('should have correct schema', () => {
    expect(rule.meta.schema).toHaveLength(1);
    expect(rule.meta.schema[0].type).toBe('object');
    expect(rule.meta.schema[0].properties).toHaveProperty('allowAnimationFrame');
    expect(rule.meta.schema[0].properties).toHaveProperty('allowIfAnimationsDisabled');
    expect(rule.meta.schema[0].properties).toHaveProperty('customAnimationPatterns');
    expect(rule.meta.schema[0].properties).toHaveProperty('ignorePatterns');
  });

  it('should return empty object for non-test files', () => {
    const context = {
      getFilename: () => 'app.js',
      report: jest.fn()
    };

    const localRule = require('../../../lib/rules/no-animation-wait');
    const visitor = localRule.create(context);
    expect(visitor).toEqual({});
  });

  it('should create proper visitor for test files', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      report: jest.fn()
    };

    const localRule = require('../../../lib/rules/no-animation-wait');
    const visitor = localRule.create(context);
    expect(visitor).toBeDefined();
    expect(visitor.Program).toBeDefined();
    expect(visitor.CallExpression).toBeDefined();
    expect(visitor.MemberExpression).toBeDefined();
  });

  describe('Edge cases', () => {
    let localRule;

    beforeEach(() => {
      localRule = require('../../../lib/rules/no-animation-wait');
    });

    it('should handle CallExpression without callee name property', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();
      const node = {
        type: 'CallExpression',
        callee: {},
        arguments: []
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle MemberExpression without property name', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {},
          property: {}
        },
        arguments: []
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle waitFor with no arguments', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'waitFor' }
        },
        arguments: []
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle waitFor with non-literal argument', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();

      // Test with Identifier
      const nodeWithIdentifier = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'waitFor' }
        },
        arguments: [{
          type: 'Identifier',
          name: 'eventName'
        }]
      };

      visitor.CallExpression(nodeWithIdentifier);
      expect(context.report).not.toHaveBeenCalled();

      // Test with CallExpression as argument
      const nodeWithCall = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'waitFor' }
        },
        arguments: [{
          type: 'CallExpression'
        }]
      };

      visitor.CallExpression(nodeWithCall);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should handle waitFor with literal that does not match pattern', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'waitFor' }
        },
        arguments: [{
          type: 'Literal',
          value: 'click'
        }]
      };

      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    });

    it('should detect transitionend in string', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'waitFor' }
        },
        arguments: [{
          type: 'Literal',
          value: 'transitionend'
        }]
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalledWith({
        node,
        messageId: 'avoidTransitionWait'
      });
    });

    it('should detect animationend in string', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'waitFor' }
        },
        arguments: [{
          type: 'Literal',
          value: 'animationend'
        }]
      };

      visitor.CallExpression(node);
      expect(context.report).toHaveBeenCalledWith({
        node,
        messageId: 'avoidTransitionWait'
      });
    });

    it('should handle callee without type property', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();
      const node = {
        type: 'CallExpression',
        callee: {
          name: 'someFunction'
        },
        arguments: []
      };

      expect(() => visitor.CallExpression(node)).not.toThrow();
    });

    it('should handle various test file patterns', () => {
      const testFilePatterns = [
        'component.test.js',
        'component.spec.js',
        'component.test.ts',
        'component.spec.ts',
        'component.test.jsx',
        'component.spec.tsx',
        'src/__tests__/component.js',
        'src/tests/component.js'
      ];

      testFilePatterns.forEach(filename => {
        const context = {
          getFilename: () => filename,
          // ESLint 9+ compatibility
          filename: filename,
          // ESLint 8 compatibility
          getPhysicalFilename: () => filename,
          report: jest.fn()
        };

        const visitor = localRule.create(context);
        // All patterns in the list should be recognized as test files
        expect(visitor.CallExpression).toBeDefined();
      });
    });

    it('should handle non-test file patterns', () => {
      const nonTestFilePatterns = [
        'component.js',
        'component.jsx',
        'src/component.ts',
        'utils/helper.tsx',
        'lib/module.js'
      ];

      nonTestFilePatterns.forEach(filename => {
        const context = {
          getFilename: () => filename,
          report: jest.fn()
        };

        const visitor = localRule.create(context);
        expect(visitor).toEqual({});
      });
    });

    it('should handle MemberExpression for Web Animations API finished property', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{}],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();

      // Test MemberExpression with finished property in AwaitExpression
      const awaitNode = {
        type: 'AwaitExpression'
      };
      const memberNode = {
        type: 'MemberExpression',
        property: { name: 'finished' },
        parent: awaitNode
      };

      visitor.MemberExpression(memberNode);
      expect(context.report).toHaveBeenCalledWith({
        node: awaitNode,
        messageId: 'avoidAnimationWait'
      });
    });

    it('should handle MemberExpression with animations disabled', () => {
      const context = {
        getFilename: () => 'test.spec.js',
        options: [{ allowIfAnimationsDisabled: true }],
        report: jest.fn(),
        getSourceCode: () => ({
          getText: () => '// animation-duration: 0s !important;\nconst test = animation.finished;',
          getCommentsBefore: () => []
        })
      };

      const visitor = localRule.create(context);
      visitor.Program();

      const awaitNode = {
        type: 'AwaitExpression'
      };
      const memberNode = {
        type: 'MemberExpression',
        property: { name: 'finished' },
        parent: awaitNode
      };

      visitor.MemberExpression(memberNode);
      expect(context.report).not.toHaveBeenCalled();
    });
  });
});