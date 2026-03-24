/**
 * Examples of no-animation-wait rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

// Mock declarations to avoid no-undef errors
// These are intentionally defined at module level for this test file
const waitForAnimation = async () => {};
const waitForAnimationComplete = async () => {};
const waitForTransition = async () => {};
const waitFor = async () => {};
const triggerAnimation = () => {};
const startAnimation = () => {};
const requestAnimationFrame = (callback) => callback();
const Velocity = () => {};
const useSpring = () => ({ opacity: { getValue: () => 1 } });
const useAnimation = () => ({ start: async () => {} });
const $ = () => ({ fadeIn: (_duration, callback) => callback && callback() });

describe('Animation Wait Violations', () => {

  describe('Animation helper functions', () => {
    // ❌ BAD: waitForAnimation helper
    it('should not use waitForAnimation', async () => {
      const element = { classList: { contains: () => true } };
      triggerAnimation();
      await waitForAnimation(); // Should trigger no-animation-wait
      expect(element).toHaveClass('animated');
    });

    // ❌ BAD: waitForAnimationComplete helper
    it('should not use waitForAnimationComplete', async () => {
      const modal = { isVisible: () => true };
      await waitForAnimationComplete('.modal'); // Should trigger no-animation-wait
      expect(modal).toBeVisible();
    });

    // ❌ BAD: waitForTransition helper
    it('should not use waitForTransition', async () => {
      const element = { classList: { contains: () => true } };
      await waitForTransition('.slide-panel'); // Should trigger no-animation-wait
      expect(element).toHaveClass('transitioned');
    });
  });

  describe('requestAnimationFrame waits', () => {
    // ❌ BAD: Single requestAnimationFrame
    it('should not wait for single animation frame', (done) => {
      const element = { style: { transform: '' } };
      startAnimation();

      requestAnimationFrame(() => { // Should trigger no-animation-wait
        expect(element.style.transform).toBe('translateX(50px)');
        done();
      });
    });

    // ❌ BAD: Nested requestAnimationFrame
    it('should not wait for multiple animation frames', (done) => {
      const element = { style: { transform: '' } };
      startAnimation();

      requestAnimationFrame(() => { // Should trigger no-animation-wait
        requestAnimationFrame(() => { // Should trigger no-animation-wait
          expect(element.style.transform).toBe('translateX(100px)');
          done();
        });
      });
    });
  });

  describe('CSS transition/animation events', () => {
    // ❌ BAD: Transition end events
    it('should not wait for transitionend', (done) => {
      const element = {
        classList: { add: () => {}, contains: () => true },
        addEventListener: () => {}
      };
      element.classList.add('transitioning');

      element.addEventListener('transitionend', () => {
        expect(element.classList.contains('transitioned')).toBe(true);
        done();
      });
    });

    // ❌ BAD: Animation end events
    it('should not wait for animationend', (done) => {
      const element = {
        classList: { add: () => {}, contains: () => true },
        addEventListener: () => {}
      };
      element.classList.add('animating');

      element.addEventListener('animationend', () => {
        expect(element.classList.contains('animated')).toBe(true);
        done();
      });
    });
  });

  describe('Animation timing with setTimeout', () => {
    // ❌ BAD: Waiting for CSS animation duration
    it('should not wait with setTimeout for animation duration', async () => {
      const button = { click: async () => {} };
      const modal = { isVisible: () => true };
      await button.click();

      // Waiting for animation to complete (comment indicates animation wait)
      await waitFor(() => {
        expect(true).toBe(true);
      });

      expect(modal).toBeVisible();
    });

    // ❌ BAD: CSS transition timing
    it('should not hardcode CSS transition delays', async () => {
      const element = { style: { transition: '', opacity: '' } };
      element.style.transition = 'opacity 500ms';
      element.style.opacity = '0';

      await waitFor(() => {
        expect(true).toBe(true);
      });

      expect(element.style.opacity).toBe('0');
    });
  });

  describe('jQuery animations', () => {
    // ❌ BAD: Waiting for jQuery animations
    it('should not wait for jQuery fadeIn', (done) => {
      $('.element').fadeIn(400, () => {
        expect($('.element')).toBeVisible();
        done();
      });
    });
  });

  describe('Animation libraries', () => {
    // ❌ BAD: Velocity.js animations
    it('should not wait for Velocity animations', (done) => {
      const element = { style: { opacity: '1' } };
      Velocity(element, { opacity: 0 }, {
        duration: 400,
        complete: () => {
          expect(element.style.opacity).toBe('0');
          done();
        }
      });
    });

    // ❌ BAD: GSAP/TweenMax animations
    it('should not wait for GSAP animations', async () => {
      const element = { transform: '' };
      const TweenMax = { to: () => {} };
      TweenMax.to(element, 0.5, {
        x: 100,
        onComplete: () => {
          expect(element.transform).toContain('100');
        }
      });

      await waitFor(() => {
        expect(true).toBe(true);
      });
    });

    // ❌ BAD: React Spring animations
    it('should not wait for React Spring', async () => {
      const spring = useSpring({ opacity: 1, from: { opacity: 0 } });

      // Waiting for spring animation
      await waitFor(() => expect(spring.opacity.getValue()).toBe(1), { timeout: 1000 });
    });

    // ❌ BAD: Framer Motion animations
    it('should not wait for Framer Motion', async () => {
      const element = { style: { transform: '' } };
      const controls = useAnimation();

      await controls.start({
        x: 100,
        transition: { duration: 0.5 }
      });

      expect(element).toHaveStyle({ transform: 'translateX(100px)' });
    });
  });

  describe('Web Animations API', () => {
    // ❌ BAD: Web Animations API
    it('should not wait for Web Animations', async () => {
      const element = {
        style: { transform: '' },
        animate: () => ({ finished: Promise.resolve() })
      };
      const animation = element.animate([
        { transform: 'translateX(0px)' },
        { transform: 'translateX(100px)' }
      ], {
        duration: 1000,
        fill: 'forwards'
      });

      await animation.finished; // Waiting for animation

      expect(element.style.transform).toBe('translateX(100px)');
    });
  });

  describe('Playwright-specific animation waits', () => {
    // ❌ BAD: page.waitForSelector with visible state (often waits for animations)
    it('should not use waitForSelector with visible state', async () => {
      const button = { click: async () => {} };
      const modal = { isVisible: () => true };
      const page = {
        waitForSelector: async () => {}
      };
      await button.click();

      // Wait for element to be visible (can wait for animations to complete)
      await page.waitForSelector('[data-testid="modal"]', { state: 'visible' }); // Should trigger no-animation-wait

      expect(modal).toBeVisible();
    });
  });

  describe('Cypress-specific animation waits', () => {
    // ❌ BAD: cy.waitForAnimations
    it('should not use cy.waitForAnimations', () => {
      const element = { isVisible: () => true };
      const cy = { waitForAnimations: () => {} };
      cy.waitForAnimations(); // Should trigger no-animation-wait
      expect(element).toBeVisible();
    });

    // ❌ BAD: cy.waitForAnimation
    it('should not use cy.waitForAnimation', () => {
      const element = { isVisible: () => true };
      const cy = { waitForAnimation: () => {} };
      cy.waitForAnimation(); // Should trigger no-animation-wait
      expect(element).toBeVisible();
    });

    // ❌ BAD: cy.ensureAnimations
    it('should not use cy.ensureAnimations', () => {
      const element = { isVisible: () => true };
      const cy = { ensureAnimations: () => {} };
      cy.ensureAnimations(); // Should trigger no-animation-wait
      expect(element).toBeVisible();
    });
  });

  describe('Testing-library waitFor with animation assertions', () => {
    // ❌ BAD: waitFor with animation-related assertions
    it('should not use waitFor for animation states', async () => {
      const element = { style: { opacity: '1' } };
      await waitFor(() => {
        expect(element).toHaveStyle({ opacity: '1' }); // Should trigger no-animation-wait
      });
    });

    // ❌ BAD: waitFor with animation classes
    it('should not wait for animation classes', async () => {
      const element = { classList: { contains: () => true } };
      await waitFor(() => {
        expect(element).toHaveClass('fade-in-complete'); // Should trigger no-animation-wait
      });
    });
  });
});
