/**
 * Examples of no-element-removal-check rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

/* eslint-disable no-undef */

import { screen, waitForElementToBeRemoved } from '@testing-library/react';

describe('Element Removal Check Violations', () => {
  // ❌ BAD: Checking for element removal with query
  it('should not check for removal with query', async () => {
    // Click to remove element
    fireEvent.click(deleteButton);

    // Bad: Checking element doesn't exist
    await waitForElementToBeRemoved(() => screen.queryByTestId('element'));
    await waitForElementToBeRemoved(() => screen.queryByTestId('removed-element'));
    await waitForElementToBeRemoved(() => screen.queryByTestId('element'));
  });

  // ❌ BAD: Checking element is not visible
  it('should not check for invisibility', () => {
    closeModal();

    expect(modalElement).not.toBeVisible();
    expect(screen.queryByText('Modal Content')).not.toBeVisible();
  });

  // ❌ BAD: Checking display none
  it('should not check for display none', () => {
    hideElement();

    expect(element.style.display).toBe('none');
    expect(element).toHaveStyle({ display: 'none' });
  });

  // ❌ BAD: Checking element removed from DOM
  it('should not check DOM removal directly', async () => {
    const element = document.querySelector('.to-remove');
    removeElement();

    await waitForElementToBeRemoved(() => document.querySelector('.to-remove'));
    expect(document.contains(element)).toBe(false);
    expect(element.parentNode).toBeNull();
  });

  // ❌ BAD: Checking class removal for hiding
  it('should not check for hiding classes', () => {
    element.classList.remove('visible');
    element.classList.add('hidden');

    expect(element).not.toHaveClass('visible');
    expect(element).toHaveClass('hidden');
  });

  // ❌ BAD: jQuery removal checks
  it('should not check jQuery removal', () => {
    $('#element').remove();

    expect($('#element').length).toBe(0);
    expect($('#element').is(':visible')).toBe(false);
  });

  // ❌ BAD: Checking opacity for removal
  it('should not check opacity for removal', () => {
    fadeOut(element);

    expect(element.style.opacity).toBe('0');
    expect(element).toHaveStyle({ opacity: 0 });
  });

  // ❌ BAD: Checking aria-hidden for removal
  it('should not use aria-hidden for removal checks', () => {
    hideAccessibly(element);

    expect(element).toHaveAttribute('aria-hidden', 'true');
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });

  // ❌ BAD: v-if/v-show checks (Vue)
  it('should not check Vue conditional rendering', () => {
    wrapper.setData({ showElement: false });

    expect(wrapper.find('.conditional-element').exists()).toBe(false);
    expect(wrapper.find('.conditional-element').isVisible()).toBe(false);
  });

  // ❌ BAD: React conditional rendering checks
  it('should not check React conditional rendering', () => {
    component.setState({ isVisible: false });

    expect(wrapper.find('ConditionalComponent').length).toBe(0);
    expect(wrapper.exists('ConditionalComponent')).toBe(false);
  });

  // ❌ BAD: Angular *ngIf checks
  it('should not check Angular conditional rendering', () => {
    component.showElement = false;
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.css('.conditional'));
    expect(element).toBeNull();
  });

  // Note: The correct approach would be:
  // ✅ GOOD: Use waitForElementToBeRemoved
  it('correct way to check removal', async () => {
    const element = screen.getByText('To Be Removed');
    fireEvent.click(deleteButton);

    await waitForElementToBeRemoved(element);
    // Or
    await waitFor(() => {
      expect(screen.queryByText('To Be Removed')).not.toBeInTheDocument();
    });
  });
});