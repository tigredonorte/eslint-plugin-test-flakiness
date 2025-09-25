/**
 * Examples of no-immediate-assertions rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

import { screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Immediate Assertions After State Changes', () => {
  // ❌ BAD: Assertion immediately after state change
  it('should not assert immediately after setState', () => {
    const component = { setState: jest.fn(), state: { loading: false } };
    component.setState({ loading: false });
    expect(component.state.loading).toBe(false); // Immediate assertion!
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

  // ❌ BAD: Assertion immediately after userEvent (even if awaited)
  it('should use waitFor even with await', async () => {
    const button = document.createElement('button');
    await userEvent.click(button);
    await waitForElementToBeRemoved(() => screen.queryByTestId('element')); // Should use waitFor!
  });

  // ❌ BAD: Multiple assertions immediately after action
  it('should wrap multiple assertions', async () => {
    const input = document.createElement('input');
    const submitButton = document.createElement('button');
    await userEvent.type(input, 'test');
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

  // ❌ BAD: Component method call followed by immediate DOM check
  it('should wait after component methods', () => {
    const component = { showModal: jest.fn() };
    component.showModal();
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