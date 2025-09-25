/**
 * Examples of no-viewport-dependent rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Viewport Dependent Violations', () => {
  // ❌ BAD: Checking window dimensions
  it('should not check window dimensions', () => {
    expect(window.innerWidth).toBeGreaterThan(768);
    expect(window.innerHeight).toBeGreaterThan(600);
    expect(window.outerWidth).toBe(1920);
    expect(window.outerHeight).toBe(1080);
  });

  // ❌ BAD: Checking screen dimensions
  it('should not check screen properties', () => {
    expect(screen.width).toBe(1920);
    expect(screen.height).toBe(1080);
    expect(screen.availWidth).toBeGreaterThan(1000);
    expect(screen.availHeight).toBeGreaterThan(700);
  });

  // ❌ BAD: Checking element positions
  it('should not check absolute positions', () => {
    const rect = element.getBoundingClientRect();
    expect(rect.top).toBe(100);
    expect(rect.left).toBe(50);
    expect(rect.right).toBe(300);
    expect(rect.bottom).toBe(200);
  });

  // ❌ BAD: Checking scroll positions
  it('should not check scroll positions', () => {
    expect(window.scrollY).toBe(0);
    expect(window.pageYOffset).toBe(0);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(someDiv.scrollTop).toBeLessThan(100); // Using non-mock element
  });

  // ❌ BAD: Media query based tests
  it('should not test media query states', () => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    expect(mediaQuery.matches).toBe(true);

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    expect(isMobile).toBe(false);
  });

  // ❌ BAD: Responsive visibility checks
  it('should not check responsive visibility', () => {
    // Checking if mobile menu is visible
    if (window.innerWidth < 768) {
      expect(mobileMenu).toBeVisible();
      expect(desktopMenu).not.toBeVisible();
    } else {
      expect(desktopMenu).toBeVisible();
      expect(mobileMenu).not.toBeVisible();
    }
  });

  // ❌ BAD: CSS pixel-based assertions
  it('should not assert exact pixel values', () => {
    const styles = window.getComputedStyle(element);
    expect(styles.width).toBe('250px');
    expect(styles.height).toBe('100px');
    expect(styles.marginTop).toBe('20px');
    expect(styles.fontSize).toBe('16px');
  });

  // ❌ BAD: Viewport-relative units
  it('should not test viewport units', () => {
    const styles = window.getComputedStyle(element);
    // These depend on viewport size
    expect(styles.width).toBe('50vw');
    expect(styles.height).toBe('100vh');
    expect(styles.fontSize).toBe('5vmin');
  });

  // ❌ BAD: Element offset checks
  it('should not check element offsets', () => {
    expect(element.offsetTop).toBe(150);
    expect(element.offsetLeft).toBe(200);
    expect(element.offsetWidth).toBe(300);
    expect(element.offsetHeight).toBe(400);
  });

  // ❌ BAD: Client dimensions
  it('should not check client dimensions', () => {
    expect(element.clientWidth).toBe(280);
    expect(element.clientHeight).toBe(380);
    expect(document.documentElement.clientWidth).toBe(1920);
  });

  // ❌ BAD: Intersection Observer based tests
  it('should not test intersection directly', () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        expect(entry.intersectionRatio).toBeGreaterThan(0.5);
        expect(entry.isIntersecting).toBe(true);
      });
    });

    observer.observe(element);
  });

  // ❌ BAD: Resize Observer tests
  it('should not test resize observations', () => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        expect(entry.contentRect.width).toBe(500);
        expect(entry.contentRect.height).toBe(300);
      }
    });

    resizeObserver.observe(element);
  });

  // ❌ BAD: Touch/pointer position tests
  it('should not test touch positions', () => {
    const touch = {
      clientX: 150,
      clientY: 200,
      screenX: 150,
      screenY: 250
    };

    expect(touch.clientX).toBe(150);
    expect(touch.screenY).toBe(250);
  });

  // ❌ BAD: Device pixel ratio checks
  it('should not check device pixel ratio', () => {
    expect(window.devicePixelRatio).toBe(2); // Retina display
    expect(window.devicePixelRatio).toBeGreaterThanOrEqual(1);
  });
});