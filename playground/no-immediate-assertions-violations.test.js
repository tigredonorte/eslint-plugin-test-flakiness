/**
 * Examples of no-immediate-assertions rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

/* eslint-disable test-flakiness/await-async-events */

import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock screen methods to avoid runtime errors in playground
screen.getByText = jest.fn(() => ({ toBeInTheDocument: () => true }));
screen.getByRole = jest.fn(() => ({ toBeVisible: () => true }));

// Mock matchers
expect.extend({
  toBeInTheDocument() {
    return { pass: true };
  },
  toBeVisible() {
    return { pass: true };
  },
  toBeEnabled() {
    return { pass: true };
  }
});

describe('Immediate Assertions After State Changes', () => {
  // ❌ BAD: Assertion immediately after state change
  // Fixer: wraps in await waitFor() AND makes callback async
  it('should not assert immediately after setState', () => {
    const component = { setState: jest.fn(), state: { loading: false } };
    component.setState({ loading: false });
    expect(component.state.loading).toBe(false); // Fixer: await waitFor(() => { expect(...) })
  });

  // ❌ BAD: Assertion immediately after dispatch
  it('should not assert immediately after dispatch', () => {
    const store = { dispatch: jest.fn(), getState: () => ({ counter: 1 }) };
    store.dispatch({ type: 'INCREMENT' });
    expect(store.getState().counter).toBe(1); // Immediate assertion!
  });

  // ❌ BAD: DOM assertion immediately after fireEvent
  it('should not assert immediately after fireEvent', () => {
    const button = document.createElement('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument(); // Immediate assertion!
  });

  // ❌ BAD: Assertion immediately after userEvent
  it('should use waitFor after userEvent', () => {
    const button = document.createElement('button');
    userEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument(); // Immediate assertion!
  });

  // ❌ BAD: Multiple assertions immediately after action
  it('should wrap multiple assertions', () => {
    const input = document.createElement('input');
    const submitButton = document.createElement('button');
    userEvent.type(input, 'test');
    expect(input.value).toBe('test'); // Immediate!
    expect(screen.getByText('Valid')).toBeInTheDocument(); // Immediate!
    expect(submitButton).toBeEnabled(); // Immediate!
  });

  // ❌ BAD: Inline pattern with sequence expression
  it('should not use inline assertions', () => {
    const btn = document.createElement('button');
    fireEvent.click(btn), expect(screen.getByText('Done')).toBeInTheDocument();
  });

  // ❌ BAD: setProps followed by immediate assertion
  it('should not assert immediately after setProps', () => {
    const wrapper = { setProps: jest.fn(), prop: () => 'new' };
    wrapper.setProps({ value: 'new' });
    expect(wrapper.prop('value')).toBe('new'); // Immediate assertion!
  });

  // ❌ BAD: Vuex commit followed by immediate assertion
  it('should not assert immediately after commit', () => {
    const userData = { name: 'test' };
    const store = { commit: jest.fn(), state: { user: userData } };
    store.commit('SET_USER', userData);
    expect(store.state.user).toEqual(userData); // Immediate assertion!
  });

  // ❌ BAD: Redux state assertion immediately after action
  it('should wait for Redux state updates', () => {
    const userData = { name: 'test' };
    const updateUser = jest.fn();
    const store = { dispatch: jest.fn(), getState: () => ({ user: userData }) };
    store.dispatch(updateUser(userData));
    expect(store.getState().user).toEqual(userData); // Immediate assertion!
  });

  // ❌ BAD: Component setState followed by immediate DOM check
  it('should wait after component methods', () => {
    const component = { setState: jest.fn() };
    component.setState({ modalOpen: true });
    expect(screen.getByRole('dialog')).toBeVisible(); // Immediate assertion!
  });

  // ❌ BAD: Form submission followed by immediate validation check
  it('should wait after form submission', () => {
    const form = document.createElement('form');
    fireEvent.submit(form);
    expect(screen.getByText('Form submitted')).toBeInTheDocument(); // Immediate!
  });

  // ❌ BAD: Trigger followed by immediate check
  it('should wait after trigger (Vue)', () => {
    const wrapper = { trigger: jest.fn(), emitted: () => ({ click: true }) };
    wrapper.trigger('click');
    expect(wrapper.emitted().click).toBeTruthy(); // Immediate assertion!
  });
});