/**
 * Examples of await-async-events rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

import { screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Missing Await for Async Events', () => {
  // Test 1: userEvent.click not awaited
  it('should await userEvent.click', () => {
    const button = screen.getByRole('button');
    userEvent.click(button); // Missing await!
  });

  // Test 2: userEvent.type not awaited
  it('should await userEvent.type', () => {
    const input = screen.getByRole('textbox');
    userEvent.type(input, 'Hello World'); // Missing await!
  });

  // Test 3: userEvent.clear not awaited
  it('should await userEvent.clear', () => {
    const input = screen.getByRole('textbox');
    userEvent.clear(input); // Missing await!
  });

  // Test 4: userEvent.dblClick not awaited
  it('should await userEvent.dblClick', () => {
    const button = screen.getByRole('button');
    userEvent.dblClick(button); // Missing await!
  });

  // Test 5: userEvent.hover not awaited
  it('should await userEvent.hover', () => {
    const button = screen.getByRole('button');
    userEvent.hover(button); // Missing await!
  });

  // Test 6: userEvent.unhover not awaited
  it('should await userEvent.unhover', () => {
    const button = screen.getByRole('button');
    userEvent.unhover(button); // Missing await!
  });

  // Test 7: userEvent.tab not awaited
  it('should await userEvent.tab', () => {
    userEvent.tab(); // Missing await!
  });

  // Test 8: userEvent.selectOptions not awaited
  it('should await userEvent.selectOptions', () => {
    const select = screen.getByRole('combobox');
    userEvent.selectOptions(select, 'option1'); // Missing await!
  });

  // Test 9: fireEvent.click not awaited
  it('should await fireEvent.click', () => {
    const button = screen.getByRole('button');
    fireEvent.click(button); // Missing await!
  });

  // Test 10: fireEvent.change not awaited
  it('should await fireEvent.change', () => {
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } }); // Missing await!
  });

  // Test 11: fireEvent.submit not awaited
  it('should await fireEvent.submit', () => {
    const form = screen.getByRole('form');
    fireEvent.submit(form); // Missing await!
  });

  // Test 12: fireEvent.keyDown not awaited
  it('should await fireEvent.keyDown', () => {
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' }); // Missing await!
  });

  // Test 13: fireEvent.blur not awaited
  it('should await fireEvent.blur', () => {
    const input = screen.getByRole('textbox');
    fireEvent.blur(input); // Missing await!
  });

  // Test 14: act() with async callback not awaited
  it('should await act with async callback', async () => {
    const someAsyncOperation = async () => {
      return Promise.resolve();
    };

    act(async () => { // Missing await on act!
      await someAsyncOperation();
    });
  });

  // Test 15: Playwright page.click not awaited
  it('should await Playwright page.click', async () => {
    const page = {
      click: async () => {}
    };
    page.click('#button'); // Missing await!
  });

  // Test 16: Playwright page.fill not awaited
  it('should await Playwright page.fill', async () => {
    const page = {
      fill: async () => {}
    };
    page.fill('#input', 'text'); // Missing await!
  });

  // Test 17: Playwright page.type not awaited
  it('should await Playwright page.type', async () => {
    const page = {
      type: async () => {}
    };
    page.type('#input', 'more text'); // Missing await!
  });

  // Test 18: Playwright page.press not awaited
  it('should await Playwright page.press', async () => {
    const page = {
      press: async () => {}
    };
    page.press('#input', 'Enter'); // Missing await!
  });

  // Test 19: Playwright page.check not awaited
  it('should await Playwright page.check', async () => {
    const page = {
      check: async () => {}
    };
    page.check('#checkbox'); // Missing await!
  });

  // Test 20: Playwright page.uncheck not awaited
  it('should await Playwright page.uncheck', async () => {
    const page = {
      uncheck: async () => {}
    };
    page.uncheck('#checkbox'); // Missing await!
  });

  // Test 21: Playwright page.selectOption not awaited
  it('should await Playwright page.selectOption', async () => {
    const page = {
      selectOption: async () => {}
    };
    page.selectOption('#select', 'option'); // Missing await!
  });

  // Test 22: Playwright page.hover not awaited
  it('should await Playwright page.hover', async () => {
    const page = {
      hover: async () => {}
    };
    page.hover('#element'); // Missing await!
  });

  // Test 23: Playwright page.tap not awaited
  it('should await Playwright page.tap', async () => {
    const page = {
      tap: async () => {}
    };
    page.tap('#button'); // Missing await!
  });

  // Test 24: Playwright page.goto not awaited
  it('should await Playwright page.goto', async () => {
    const page = {
      goto: async () => {}
    };
    page.goto('https://example.com'); // Missing await!
  });

  // Test 25: Playwright page.reload not awaited
  it('should await Playwright page.reload', async () => {
    const page = {
      reload: async () => {}
    };
    page.reload(); // Missing await!
  });

  // Test 26: Playwright page.waitForSelector not awaited
  it('should await Playwright page.waitForSelector', async () => {
    const page = {
      waitForSelector: async () => {}
    };
    page.waitForSelector('.loaded'); // Missing await!
  });

  // Test 27: Playwright page.screenshot not awaited
  it('should await Playwright page.screenshot', async () => {
    const page = {
      screenshot: async () => {}
    };
    page.screenshot(); // Missing await!
  });

  // Test 28: Element button.click not awaited
  it('should await element button.click', () => {
    const button = document.querySelector('button');
    button.click(); // Missing await!
  });

  // Test 29: Element input.select not awaited
  it('should await element input.select', () => {
    const input = document.querySelector('input');
    if (input && input.select) {
      input.select(); // This is actually synchronous, but showing pattern
    }
  });

  // Test 30: DOM element click not awaited
  it('should await DOM element click', () => {
    const link = document.querySelector('a');
    if (link && link.click) {
      link.click(); // Missing await!
    }
  });

  // Test 31: Element element.submit not awaited
  it('should await element element.submit', () => {
    const element = screen.getByTestId('element');
    element.submit(); // Missing await!
  });

  // Test 32: Custom async methods (when configured) - myAsyncHelper
  it('should await custom async method myAsyncHelper', async () => {
    const myAsyncHelper = async () => Promise.resolve('data');
    myAsyncHelper(); // Missing await!
    // Note: This would need customAsyncMethods config to trigger
  });

  // Test 33: Custom async methods (when configured) - customEvent
  it('should await custom async method customEvent', async () => {
    const customEvent = async () => Promise.resolve();
    customEvent(); // Missing await!
    // Note: This would need customAsyncMethods config to trigger
  });

  // Test 34: Custom async methods (when configured) - asyncAction
  it('should await custom async method asyncAction', async () => {
    const asyncAction = async () => Promise.resolve('result');
    asyncAction(); // Missing await!
    // Note: This would need customAsyncMethods config to trigger
  });
});