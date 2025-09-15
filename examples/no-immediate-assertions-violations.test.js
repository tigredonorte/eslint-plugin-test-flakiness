/**
 * Examples of no-immediate-assertions rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Immediate Assertions After State Changes', () => {
  // ❌ BAD: Assertion immediately after state change
  it('should not assert immediately after setState', () => {
    component.setState({ loading: false });
    expect(component.state.loading).toBe(false); // Immediate assertion!
  });

  // ❌ BAD: Assertion immediately after dispatch
  it('should not assert immediately after dispatch', () => {
    store.dispatch({ type: 'INCREMENT' });
    expect(store.getState().counter).toBe(1); // Immediate assertion!
  });

  // ❌ BAD: DOM assertion immediately after fireEvent
  it('should not assert immediately after fireEvent', () => {
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument(); // Immediate assertion!
  });

  // ❌ BAD: Assertion immediately after userEvent (even if awaited)
  it('should use waitFor even with await', async () => {
    await userEvent.click(button);
    await waitForElementToBeRemoved(() => screen.queryByTestId('element')); // Should use waitFor!
  });

  // ❌ BAD: Multiple assertions immediately after action
  it('should wrap multiple assertions', async () => {
    await userEvent.type(input, 'test');
    expect(input.value).toBe('test'); // Immediate!
    expect(screen.getByText('Valid')).toBeInTheDocument(); // Immediate!
    expect(submitButton).toBeEnabled(); // Immediate!
  });

  // ❌ BAD: Inline pattern with sequence expression
  it('should not use inline assertions', () => {
    fireEvent.click(btn), expect(screen.getByText('Done')).toBeInTheDocument();
  });

  // ❌ BAD: setProps followed by immediate assertion
  it('should not assert immediately after setProps', () => {
    wrapper.setProps({ value: 'new' });
    expect(wrapper.prop('value')).toBe('new'); // Immediate assertion!
  });

  // ❌ BAD: Vuex commit followed by immediate assertion
  it('should not assert immediately after commit', () => {
    store.commit('SET_USER', userData);
    expect(store.state.user).toEqual(userData); // Immediate assertion!
  });

  // ❌ BAD: Redux state assertion immediately after action
  it('should wait for Redux state updates', () => {
    store.dispatch(updateUser(userData));
    expect(store.getState().user).toEqual(userData); // Immediate assertion!
  });

  // ❌ BAD: Component method call followed by immediate DOM check
  it('should wait after component methods', () => {
    component.showModal();
    expect(screen.getByRole('dialog')).toBeVisible(); // Immediate assertion!
  });

  // ❌ BAD: Form submission followed by immediate validation check
  it('should wait after form submission', () => {
    fireEvent.submit(form);
    expect(screen.getByText('Form submitted')).toBeInTheDocument(); // Immediate!
  });

  // ❌ BAD: Trigger followed by immediate check
  it('should wait after trigger (Vue)', () => {
    wrapper.trigger('click');
    expect(wrapper.emitted().click).toBeTruthy(); // Immediate assertion!
  });
});