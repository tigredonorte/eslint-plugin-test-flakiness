/**
 * Examples of await-async-events rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

import { screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Missing Await for Async Events', () => {
  // ❌ BAD: userEvent methods not awaited
  it('should await userEvent.click', () => {
    const button = screen.getByRole('button');
    userEvent.click(button); // Missing await!
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });

  // ❌ BAD: Multiple userEvent methods not awaited
  it('should await userEvent interactions', () => {
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    userEvent.type(input, 'Hello World'); // Missing await!
    userEvent.clear(input); // Missing await!
    userEvent.dblClick(button); // Missing await!
    userEvent.hover(button); // Missing await!
    userEvent.unhover(button); // Missing await!
    userEvent.tab(); // Missing await!
    userEvent.selectOptions(screen.getByRole('combobox'), 'option1'); // Missing await!

    expect(input.value).toBe('');
  });

  // ❌ BAD: fireEvent methods that should be awaited
  it('should await fireEvent methods', () => {
    const button = screen.getByRole('button');
    const input = screen.getByRole('textbox');
    const form = screen.getByRole('form');

    fireEvent.click(button); // Missing await!
    fireEvent.change(input, { target: { value: 'test' } }); // Missing await!
    fireEvent.submit(form); // Missing await!
    fireEvent.focus(input); // Missing await!
    fireEvent.blur(input); // Missing await!

    expect(input.value).toBe('test');
  });

  // ❌ BAD: act() with async callback not awaited
  it('should await act with async callback', async () => {
    const someAsyncOperation = async () => {
      // Simulate async operation
      return Promise.resolve();
    };

    act(async () => { // Missing await on act!
      await someAsyncOperation();
    });

    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  // ❌ BAD: Playwright page methods not awaited
  it('should await Playwright methods', async () => {
    // Mock Playwright page object for demonstration
    const page = {
      click: async () => {},
      fill: async () => {},
      type: async () => {},
      press: async () => {},
      check: async () => {},
      uncheck: async () => {},
      selectOption: async () => {},
      hover: async () => {},
      focus: async () => {},
      goto: async () => {},
      reload: async () => {},
      waitForSelector: async () => {},
      screenshot: async () => {},
      url: () => 'https://example.com'
    };

    page.click('#button'); // Missing await!
    page.fill('#input', 'text'); // Missing await!
    page.type('#input', 'more text'); // Missing await!
    page.press('#input', 'Enter'); // Missing await!
    page.check('#checkbox'); // Missing await!
    page.uncheck('#checkbox'); // Missing await!
    page.selectOption('#select', 'option'); // Missing await!
    page.hover('#element'); // Missing await!
    page.focus('#input'); // Missing await!
    page.goto('https://example.com'); // Missing await!
    page.reload(); // Missing await!
    page.waitForSelector('.loaded'); // Missing await!
    page.screenshot(); // Missing await!

    expect(page.url()).toBe('https://example.com');
  });

  // ❌ BAD: Element methods not awaited
  it('should await element methods', () => {
    const button = document.querySelector('button');
    const input = document.querySelector('input');
    const element = screen.getByTestId('element');

    button.click(); // Missing await!
    input.focus(); // Missing await!
    input.blur(); // Missing await!
    element.submit(); // Missing await!

    expect(button).toHaveBeenClicked();
  });

  // ❌ BAD: Custom async methods (if configured)
  it('should await custom async methods', async () => {
    // Mock custom async functions for demonstration
    const myAsyncHelper = async () => Promise.resolve('data');
    const customEvent = async () => Promise.resolve();
    const asyncAction = async () => Promise.resolve('result');

    // Assuming these are configured as customAsyncMethods
    myAsyncHelper(); // Missing await!
    customEvent(); // Missing await!
    const result = asyncAction(); // Missing await!

    expect(result).toBeDefined();
  });
});