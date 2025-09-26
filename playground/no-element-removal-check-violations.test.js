/**
 * Examples of no-element-removal-check rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */


import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';

describe('Element Removal Check Violations', () => {
  // Define mock variables to avoid undef errors
  let deleteButton, modalElement, element;

  beforeEach(() => {
    deleteButton = document.createElement('button');
    modalElement = document.createElement('div');
    element = document.createElement('div');
    element.classList = { remove: () => {}, add: () => {} };
    element.style = {};
    element.parentNode = null;
  });

  afterEach(() => {
    // Cleanup to satisfy test-isolation rule
    deleteButton = null;
    modalElement = null;
    element = null;
  });

  // Violation 1: Using .not.toBeInTheDocument() without waitFor
  it('detects not.toBeInTheDocument without waitFor', () => {
    // This should trigger: avoidNotInDocument message
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  // Violation 2: Checking query returns null
  it('detects checking queryBy returns toBeNull', () => {
    // This should trigger: useWaitForRemoval message
    expect(screen.queryByTestId('element')).toBeNull();
  });

  // Violation 3: Checking query returns undefined
  it('detects checking queryBy returns toBeUndefined', () => {
    // This should trigger: useWaitForRemoval message
    expect(screen.queryByRole('button')).toBeUndefined();
  });

  // Violation 4: Checking query returns falsy
  it('detects checking queryBy returns toBeFalsy', () => {
    // This should trigger: useWaitForRemoval message
    expect(screen.queryByLabelText('Submit')).toBeFalsy();
  });

  // Violation 5: Using .not.toBeDefined() with query methods
  it('detects not.toBeDefined with query methods', () => {
    // This should trigger: useWaitForRemoval message
    expect(screen.queryByText('Removed')).not.toBeDefined();
  });

  // Violation 6: Direct null check with query method
  it('detects direct null comparison with query', () => {
    // This should trigger: useWaitForRemoval message
    if (screen.queryByTestId('item') === null) {
      // Element not found - doing something with the condition
      // Simulating an action based on the null check
    }
  });

  // Violation 7: Using .not.toBeVisible() without waitFor
  it('detects not.toBeVisible without waitFor', () => {
    // This should trigger: avoidNotInDocument message
    expect(modalElement).not.toBeVisible();
  });

  // Violation 8: Using !document.contains(element)
  it('detects negated document.contains', () => {
    const testElement = document.createElement('div');
    // This should trigger: avoidRemovalCheck message
    const isRemoved = !document.contains(testElement);
    if (isRemoved) {
      // Simulating an action based on the removal check
    }
  });

  // Violation 9: querySelector with null check
  it('detects querySelector with toBeNull', () => {
    const container = document.createElement('div');
    // This should trigger: useWaitForRemoval message for querySelector
    expect(container.querySelector('.removed')).toBeNull();
  });

  // Violation 10: Container query method with null check
  it('detects container query with null check', () => {
    const container = { queryByText: () => null };
    // This should trigger: useWaitForRemoval message
    expect(container.queryByText('Gone')).toBeNull();
  });

  // Note: The correct approach would be:
  // ✅ GOOD: Use waitForElementToBeRemoved
  it('correct way to check removal', async () => {
    const testElement = screen.getByText('To Be Removed');
    const fireEvent = { click: async () => {} };
    await fireEvent.click(deleteButton);

    await waitForElementToBeRemoved(testElement);
    // Or
    await waitFor(() => {
      expect(screen.queryByText('To Be Removed')).not.toBeInTheDocument();
    });
  });
});