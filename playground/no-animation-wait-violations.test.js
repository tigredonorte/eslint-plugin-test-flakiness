/**
 * Examples of no-animation-waits rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

/* eslint-disable no-undef */

describe('Animation Wait Violations', () => {
  // ❌ BAD: Waiting for CSS animations
  it('should not wait for animations', async () => {
    button.click();

    // Waiting for animation to complete
    await new Promise(resolve => setTimeout(resolve, 300)); // CSS animation duration

    expect(modal).toBeVisible();
  });

  // ❌ BAD: waitForAnimation helper
  it('should not use waitForAnimation', async () => {
    triggerAnimation();

    await waitForAnimation(); // Custom animation wait helper
    await waitForAnimationComplete('.modal');
    await waitForTransition('.slide-panel');

    expect(element).toHaveClass('animated');
  });

  // ❌ BAD: Waiting for jQuery animations
  it('should not wait for jQuery animations', (done) => {
    $('.element').fadeIn(400, () => {
      expect($('.element')).toBeVisible();
      done();
    });
  });

  // ❌ BAD: requestAnimationFrame waits
  it('should not wait for requestAnimationFrame', (done) => {
    startAnimation();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Waiting for 2 animation frames
        expect(element.style.transform).toBe('translateX(100px)');
        done();
      });
    });
  });

  // ❌ BAD: Transition end events
  it('should not wait for transitionend', (done) => {
    element.classList.add('transitioning');

    element.addEventListener('transitionend', () => {
      expect(element.classList.contains('transitioned')).toBe(true);
      done();
    });
  });

  // ❌ BAD: Animation end events
  it('should not wait for animationend', (done) => {
    element.classList.add('animating');

    element.addEventListener('animationend', () => {
      expect(element.classList.contains('animated')).toBe(true);
      done();
    });
  });

  // ❌ BAD: CSS transition timing
  it('should not hardcode CSS transition delays', async () => {
    element.style.transition = 'opacity 500ms';
    element.style.opacity = '0';

    await new Promise(resolve => setTimeout(resolve, 500)); // Matching CSS duration

    expect(element.style.opacity).toBe('0');
  });

  // ❌ BAD: Velocity.js animations
  it('should not wait for Velocity animations', (done) => {
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
    TweenMax.to(element, 0.5, {
      x: 100,
      onComplete: () => {
        expect(element.transform).toContain('100');
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));
  });

  // ❌ BAD: React Spring animations
  it('should not wait for React Spring', async () => {
    const spring = useSpring({ opacity: 1, from: { opacity: 0 } });

    // Waiting for spring animation
    await waitFor(() => expect(true).toBe(true), { timeout: 1000 });

    expect(spring.opacity.getValue()).toBe(1);
  });

  // ❌ BAD: Framer Motion animations
  it('should not wait for Framer Motion', async () => {
    const controls = useAnimation();

    await controls.start({
      x: 100,
      transition: { duration: 0.5 }
    });

    // Should not wait for animation
    expect(element).toHaveStyle({ transform: 'translateX(100px)' });
  });

  // ❌ BAD: Web Animations API
  it('should not wait for Web Animations', async () => {
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