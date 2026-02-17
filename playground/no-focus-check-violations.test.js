/**
 * Examples of no-focus-check rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Focus Check Violations', () => {
  // ❌ BAD: Checking document.activeElement
  // Fixer: wraps focus() in await act(), wraps assertions in await waitFor(),
  //        AND makes the callback async if not already
  it('should not check document.activeElement', () => {
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(document.activeElement.id).toBe('username-input');
    expect(document.activeElement.tagName).toBe('INPUT');
  });

  // ❌ BAD: Checking :focus pseudo-class
  it('should not check :focus selector', () => {
    button.focus();
    const focusedElement = document.querySelector(':focus');
    expect(focusedElement).toBe(button);
    expect(document.querySelector('input:focus')).toBeTruthy();
  });

  // ❌ BAD: Checking hasFocus()
  it('should not use hasFocus', () => {
    expect(document.hasFocus()).toBe(true);
    expect(window.document.hasFocus()).toBe(true);
  });

  // ❌ BAD: Testing focus events
  it('should not test focus events directly', () => {
    let focused = false;
    input.addEventListener('focus', () => {
      focused = true;
    });

    input.focus();
    expect(focused).toBe(true);
  });

  // ❌ BAD: Testing blur events
  it('should not test blur events directly', () => {
    let blurred = false;
    input.addEventListener('blur', () => {
      blurred = true;
    });

    input.blur();
    expect(blurred).toBe(true);
  });

  // ❌ BAD: jQuery focus checks
  it('should not check jQuery focus', () => {
    $('#input').focus();
    expect($('#input').is(':focus')).toBe(true);
    expect($(':focus').attr('id')).toBe('input');
  });

  // ❌ BAD: Testing focus trap
  it('should not test focus trap implementation', () => {
    const modal = document.querySelector('.modal');
    const focusableElements = modal.querySelectorAll('button, input, select, textarea');

    focusableElements[0].focus();
    expect(document.activeElement).toBe(focusableElements[0]);

    // Tab to next
    focusableElements[1].focus();
    expect(document.activeElement).toBe(focusableElements[1]);
  });

  // ❌ BAD: Testing autofocus attribute
  it('should not test autofocus behavior', () => {
    const input = document.createElement('input');
    input.setAttribute('autofocus', 'true');
    document.body.appendChild(input);

    expect(document.activeElement).toBe(input);
  });

  // ❌ BAD: Testing tabindex focus
  it('should not test tabindex focus order', () => {
    const firstElement = document.querySelector('[tabindex="1"]');
    const secondElement = document.querySelector('[tabindex="2"]');

    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);

    // Simulate tab
    secondElement.focus();
    expect(document.activeElement).toBe(secondElement);
  });

  // ❌ BAD: React focus testing
  it('should not test React ref focus', () => {
    const inputRef = React.createRef();

    render(<input ref={inputRef} />);
    inputRef.current.focus();

    expect(document.activeElement).toBe(inputRef.current);
  });

  // ❌ BAD: Vue focus testing
  it('should not test Vue focus', () => {
    wrapper.vm.$refs.input.focus();
    expect(document.activeElement).toBe(wrapper.vm.$refs.input);
  });

  // ❌ BAD: Focus within checks
  it('should not check focus-within', () => {
    const container = document.querySelector('.form-container');
    const input = container.querySelector('input');

    input.focus();
    expect(container.matches(':focus-within')).toBe(true);
  });

  // ❌ BAD: Testing focus order
  it('should not test focus sequence', () => {
    const elements = document.querySelectorAll('.focusable');

    elements[0].focus();
    expect(document.activeElement).toBe(elements[0]);

    // Press Tab (simulated)
    elements[1].focus();
    expect(document.activeElement).toBe(elements[1]);
  });

  // ❌ BAD: Testing focus restoration
  it('should not test focus restoration', () => {
    const originalFocus = document.activeElement;

    modal.open();
    modalInput.focus();
    expect(document.activeElement).toBe(modalInput);

    modal.close();
    expect(document.activeElement).toBe(originalFocus);
  });

  // ❌ BAD: Testing programmatic focus
  it('should not test programmatic focus', () => {
    const button = screen.getByRole('button');

    userEvent.tab();
    expect(document.activeElement).toBe(button);

    userEvent.tab();
    expect(document.activeElement).not.toBe(button);
  });
});