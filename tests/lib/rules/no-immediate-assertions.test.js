/**
 * @fileoverview Tests for no-immediate-assertions rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-immediate-assertions');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-immediate-assertions', rule, {
  valid: [
    // Test files only - non-test files should pass
    {
      code: `
        setState({ value: 1 });
        expect(value).toBe(1);
      `,
      filename: 'src/components/Button.js'
    },

    // Assertions wrapped in waitFor
    {
      code: `async () => {
        fireEvent.click(button);
        await waitFor(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'Button.test.js'
    },

    // Using waitForElement
    {
      code: `async () => {
        fireEvent.click(button);
        await waitForElement(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'Button.test.js'
    },

    // Using wait
    {
      code: `async () => {
        fireEvent.click(button);
        await wait(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'Button.test.js'
    },

    // Non-sequential statements (with other code in between)
    {
      code: `
        fireEvent.click(button);
        const result = getSomething();
        expect(result).toBe(true);
      `,
      filename: 'Component.test.js'
    },

    // Assertions not immediately after state change
    {
      code: `
        const value = 42;
        fireEvent.click(button);
        console.log('clicked');
        expect(value).toBe(42);
      `,
      filename: 'Component.test.js'
    },

    // Non-state-changing actions
    {
      code: `
        const result = calculate();
        expect(result).toBe(42);
      `,
      filename: 'utils.test.js'
    },

    // Already awaited actions don't trigger for non-DOM assertions
    {
      code: `async () => {
        await userEvent.click(button);
        expect(mockFn).toHaveBeenCalled();
      }`,
      filename: 'Component.test.js'
    },

    // Nested in different blocks
    {
      code: `
        if (condition) {
          fireEvent.click(button);
        }
        if (otherCondition) {
          expect(value).toBe(1);
        }
      `,
      filename: 'Component.test.js'
    },

    // Inside try-catch blocks
    {
      code: `
        try {
          fireEvent.click(button);
        } catch (e) {
          expect(e).toBeDefined();
        }
      `,
      filename: 'Component.test.js'
    },

    // Cypress commands (different pattern)
    {
      code: `
        cy.click('#button');
        cy.contains('Clicked').should('exist');
      `,
      filename: 'cypress/e2e/button.cy.js'
    },

    // Playwright (different pattern)
    {
      code: `async () => {
        await page.click('#button');
        await expect(page.locator('.result')).toBeVisible();
      }`,
      filename: 'playwright/button.spec.js'
    },

    // Valid with configuration options
    {
      code: `
        render(Component);
        expect(screen.getByText('Hello')).toBeInTheDocument();
      `,
      filename: 'RenderValid.test.js',
      options: [{ allowedAfterOperations: ['render'] }]
    },
    {
      code: `
        fireEvent.click(button);
        expect(result).toBe(true);
      `,
      filename: 'ClickValid.test.js',
      options: [{ requireWaitFor: false }]
    },
    {
      code: `
        userEvent.click(button);
        expect(screen.getByTestId('result')).toBeVisible();
      `,
      filename: 'TestIdValid.test.js',
      options: [{ ignoreDataTestId: true }]
    },

    // Test allowedAfterOperations with method calls
    {
      code: `
        utils.customMethod();
        expect(result).toBe(true);
      `,
      filename: 'CustomMethod.test.js',
      options: [{ allowedAfterOperations: ['customMethod'] }]
    },

    // Test allowedAfterOperations with object.method format
    {
      code: `
        utils.customMethod();
        expect(result).toBe(true);
      `,
      filename: 'ObjectMethod.test.js',
      options: [{ allowedAfterOperations: ['utils.customMethod'] }]
    },

    // Test waitForElement wrapper
    {
      code: `async () => {
        fireEvent.click(button);
        await waitForElement(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'WaitForElement.test.js'
    },

    // Test wait wrapper
    {
      code: `async () => {
        fireEvent.click(button);
        await wait(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'Wait.test.js'
    },

    // Test nested waitFor with property call
    {
      code: `async () => {
        fireEvent.click(button);
        await utils.waitFor(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'PropertyWaitFor.test.js'
    },

    // Test method that includes pattern but with allowed operation
    {
      code: `
        customClick();
        expect(result).toBe(true);
      `,
      filename: 'AllowedClick.test.js',
      options: [{ allowedAfterOperations: ['customClick'] }]
    },

    // Test arrow function with expression body (should not trigger)
    {
      code: 'const handler = () => fireEvent.click(button)',
      filename: 'ArrowExpression.test.js'
    },


    // Test await expression with fireEvent
    {
      code: `async () => {
        await fireEvent.click(button);
        expect(result).toBe(true);
      }`,
      filename: 'AwaitFireEvent.test.js'
    },

    // Test waitFor with property access (lines 131-136)
    {
      code: `async () => {
        fireEvent.click(button);
        await helpers.waitFor(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'HelperWaitFor.test.js'
    },

    // Test statement in non-block parent (line 157)
    {
      code: `
        if (condition) fireEvent.click(button);
        if (otherCondition) expect(element).toBeVisible();
      `,
      filename: 'NonBlockParent.test.js'
    },

    // Test arrow function with no block body (line 165)
    {
      code: 'const handler = () => element.focus()',
      filename: 'ArrowNoBlock.test.js'
    },

    // Test configuration: requireWaitFor false for sequence expression (line 270)
    {
      code: `
        (fireEvent.click(button), expect(screen.getByText('Clicked')).toBeInTheDocument());
      `,
      filename: 'SequenceNoWaitFor.test.js',
      options: [{ requireWaitFor: false }]
    },

    // Test configuration: ignoreDataTestId true for sequence expression (line 275)
    {
      code: `
        (fireEvent.click(button), expect(screen.getByTestId('result')).toBeVisible());
      `,
      filename: 'SequenceIgnoreTestId.test.js',
      options: [{ ignoreDataTestId: true }]
    },

    // Test setState followed by state assertion in block (lines 305-324)
    {
      code: `
        component.setState({ value: 42 });
        expect(component.state.value).toBe(42);
      `,
      filename: 'StateBlock.test.js',
      options: [{ requireWaitFor: false }]
    },

    // Test non-state action followed by assertion (lines 305-324)
    {
      code: `
        utils.calculate();
        expect(someVariable).toBe(42);
      `,
      filename: 'NonStateAction.test.js',
      options: [{ ignoreDataTestId: true }]
    },

    // Test waitFor with property access (covers lines 131-136)
    {
      code: `async () => {
        fireEvent.click(button);
        await testing.waitFor(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'PropertyWaitFor2.test.js'
    },

    // Test nested parent traversal (covers line 165)
    {
      code: `
        const wrapper = () => {
          fireEvent.click(button);
          return true;
        };
        const value = wrapper();
        expect(value).toBe(true);
      `,
      filename: 'NestedWrapper.test.js'
    },

    // Test lines 131-136: waitFor with property access pattern
    {
      code: `async () => {
        fireEvent.click(button);
        await testUtils.waitFor(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'WaitForProperty.test.js'
    },
    {
      code: `async () => {
        fireEvent.click(button);
        await page.waitForElement(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'WaitForElementProperty.test.js'
    },
    {
      code: `async () => {
        fireEvent.click(button);
        await helpers.wait(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      }`,
      filename: 'WaitProperty.test.js'
    },

    // Test line 165: Arrow function with expression body (no sequential statements possible)
    {
      code: 'const test = () => fireEvent.click(button)',
      filename: 'ArrowExpression.test.js'
    },
    {
      code: 'const result = () => screen.getByText(\'text\')',
      filename: 'ArrowExpressionQuery.test.js'
    },

    // Test lines 305-324: setState/dispatch with requireWaitFor = false
    {
      code: `
        component.setState({ value: 'new' });
        expect(component.state.value).toBe('new');
      `,
      filename: 'SetStateRequireWaitForFalse.test.js',
      options: [{ requireWaitFor: false }]
    },
    {
      code: `
        store.dispatch(action());
        expect(store.state).toEqual({ updated: true });
      `,
      filename: 'DispatchRequireWaitForFalse.test.js',
      options: [{ requireWaitFor: false }]
    },

    // Test lines 317-318: ignoreDataTestId with setState/dispatch
    {
      code: `
        component.setState({ value: 'new' });
        expect(screen.getByTestId('element')).toHaveTextContent('new');
      `,
      filename: 'SetStateDataTestId.test.js',
      options: [{ ignoreDataTestId: true }]
    },
    {
      code: `
        store.dispatch(updateAction());
        expect(screen.queryByTestId('status')).toHaveTextContent('updated');
      `,
      filename: 'DispatchDataTestId.test.js',
      options: [{ ignoreDataTestId: true }]
    }
  ],

  invalid: [
    // Basic fireEvent followed by expect
    {
      code: `
        fireEvent.click(button);
        expect(screen.getByText('Clicked')).toBeInTheDocument();
      `,
      filename: 'Button.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.click' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
fireEvent.click(button);
        await waitFor(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      `
    },

    // userEvent followed by DOM assertion
    {
      code: `
        userEvent.type(input, 'test');
        expect(screen.getByDisplayValue('test')).toBeInTheDocument();
      `,
      filename: 'Input.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'userEvent.type' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
userEvent.type(input, 'test');
        await waitFor(() => {
          expect(screen.getByDisplayValue('test')).toBeInTheDocument();
        });
      `
    },

    // setState followed by state assertion
    {
      code: `
        component.setState({ value: 42 });
        expect(component.state.value).toBe(42);
      `,
      filename: 'Component.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'component.setState' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
component.setState({ value: 42 });
        await waitFor(() => {
          expect(component.state.value).toBe(42);
        });
      `
    },

    // dispatch followed by store assertion
    {
      code: `
        store.dispatch(action);
        expect(store.getState().value).toBe(42);
      `,
      filename: 'redux.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'store.dispatch' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
store.dispatch(action);
        await waitFor(() => {
          expect(store.getState().value).toBe(42);
        });
      `
    },

    // setProps followed by props assertion
    {
      code: `
        wrapper.setProps({ value: 42 });
        expect(wrapper.props().value).toBe(42);
      `,
      filename: 'Component.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'wrapper.setProps' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
wrapper.setProps({ value: 42 });
        await waitFor(() => {
          expect(wrapper.props().value).toBe(42);
        });
      `
    },

    // Inline sequence expression pattern
    {
      code: `
        (fireEvent.click(button), expect(screen.getByText('Clicked')).toBeInTheDocument());
      `,
      filename: 'Button.test.js',
      errors: [{
        messageId: 'needsWaitForDom'
      }]
    },

    // Multiple fireEvent calls
    {
      code: `
        fireEvent.click(button1);
        expect(result1).toBe(true);
        fireEvent.click(button2);
        expect(result2).toBe(true);
      `,
      filename: 'MultiButton.test.js',
      errors: [
        {
          messageId: 'needsWaitFor',
          data: { action: 'fireEvent.click' }
        },
        {
          messageId: 'needsWaitFor',
          data: { action: 'fireEvent.click' }
        }
      ],
      output: `
        import { waitFor } from '@testing-library/react';
fireEvent.click(button1);
        await waitFor(() => {
          expect(result1).toBe(true);
        });
        fireEvent.click(button2);
        expect(result2).toBe(true);
      `
    },

    // simulate (Enzyme pattern)
    {
      code: `
        wrapper.simulate('click');
        expect(wrapper.find('.result')).toHaveLength(1);
      `,
      filename: 'Enzyme.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'wrapper.simulate' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
wrapper.simulate('click');
        await waitFor(() => {
          expect(wrapper.find('.result')).toHaveLength(1);
        });
      `
    },

    // trigger (Vue Test Utils pattern)
    {
      code: `
        wrapper.trigger('click');
        expect(wrapper.text()).toBe('Clicked');
      `,
      filename: 'Vue.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'wrapper.trigger' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
wrapper.trigger('click');
        await waitFor(() => {
          expect(wrapper.text()).toBe('Clicked');
        });
      `
    },

    // Method names containing patterns
    {
      code: `
        fireEvent.click(button);
        expect(result).toBe(true);
      `,
      filename: 'Handler.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.click' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
fireEvent.click(button);
        await waitFor(() => {
          expect(result).toBe(true);
        });
      `
    },

    // fireEvent with different event types
    {
      code: `
        fireEvent.change(input, { target: { value: 'test' } });
        expect(input.value).toBe('test');
      `,
      filename: 'Input.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.change' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
fireEvent.change(input, { target: { value: 'test' } });
        await waitFor(() => {
          expect(input.value).toBe('test');
        });
      `
    },

    // submit event
    {
      code: `
        fireEvent.submit(form);
        expect(screen.getByText('Submitted')).toBeInTheDocument();
      `,
      filename: 'Form.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.submit' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText('Submitted')).toBeInTheDocument();
        });
      `
    },

    // Even with await, DOM assertions need waitFor
    {
      code: `
        userEvent.click(button);
        expect(screen.getByText('Loading')).toBeInTheDocument();
      `,
      filename: 'Async.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'userEvent.click' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
userEvent.click(button);
        await waitFor(() => {
          expect(screen.getByText('Loading')).toBeInTheDocument();
        });
      `
    },

    // commit (Vuex pattern)
    {
      code: `
        store.commit('SET_VALUE', 42);
        expect(store.state.value).toBe(42);
      `,
      filename: 'vuex.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'store.commit' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
store.commit('SET_VALUE', 42);
        await waitFor(() => {
          expect(store.state.value).toBe(42);
        });
      `
    },

    // Different indentation levels
    {
      code: `
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
      `,
      filename: 'Indented.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.click' }
      }],
      output: `
    import { waitFor } from '@testing-library/react';
fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Clicked')).toBeInTheDocument();
    });
      `
    },

    // Tab indentation
    {
      code: `
\t\tfireEvent.click(button);
\t\texpect(screen.getByText('Clicked')).toBeInTheDocument();
      `,
      filename: 'TabIndented.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.click' }
      }],
      output: `
\t\timport { waitFor } from '@testing-library/react';
fireEvent.click(button);
\t\tawait waitFor(() => {
\t\t  expect(screen.getByText('Clicked')).toBeInTheDocument();
\t\t});
      `
    },

    // Configuration: allowedAfterOperations - still errors without the allowed operations
    {
      code: `
        fireEvent.click(button);
        expect(screen.getByText('Clicked')).toBeInTheDocument();
      `,
      filename: 'AllowedOps.test.js',
      options: [{ allowedAfterOperations: ['render'] }],
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.click' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
fireEvent.click(button);
        await waitFor(() => {
          expect(screen.getByText('Clicked')).toBeInTheDocument();
        });
      `
    },


    // Configuration: ignoreDataTestId false - error for data-testid queries
    {
      code: `
        fireEvent.click(button);
        expect(screen.getByTestId('result')).toBeVisible();
      `,
      filename: 'DataTestIdError.test.js',
      options: [{ ignoreDataTestId: false }],
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.click' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
fireEvent.click(button);
        await waitFor(() => {
          expect(screen.getByTestId('result')).toBeVisible();
        });
      `
    },

    // Configuration: multiple options together
    {
      code: `
        setState({ value: 1 });
        expect(state.value).toBe(1);
      `,
      filename: 'MultiOptions.test.js',
      options: [{
        allowedAfterOperations: ['render'],
        requireWaitFor: true,
        ignoreDataTestId: false
      }],
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'setState' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
setState({ value: 1 });
        await waitFor(() => {
          expect(state.value).toBe(1);
        });
      `
    },


    // Test method that contains pattern (line 101)
    {
      code: `
        element.triggerEvent();
        expect(result).toBe(true);
      `,
      filename: 'TriggerEvent.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'element.triggerEvent' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
element.triggerEvent();
        await waitFor(() => {
          expect(result).toBe(true);
        });
      `
    },

    // Test await expression action name extraction (lines 234, 248)
    {
      code: `
        userEvent.click(button);
        expect(screen.getByText('Loading')).toBeInTheDocument();
      `,
      filename: 'AwaitActionName.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'userEvent.click' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
userEvent.click(button);
        await waitFor(() => {
          expect(screen.getByText('Loading')).toBeInTheDocument();
        });
      `
    },

    // Test no callee fallback to 'action'
    {
      code: `
        triggerEvent();
        expect(result).toBe(true);
      `,
      filename: 'NoCalleeTest.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'triggerEvent' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
triggerEvent();
        await waitFor(() => {
          expect(result).toBe(true);
        });
      `
    },

    // Test userEvent followed by DOM assertion
    {
      code: `
        userEvent.click(button);
        expect(screen.getByText('Result')).toBeInTheDocument();
      `,
      filename: 'UserEventClick.test.js',
      errors: [{
        messageId: 'needsWaitFor',
        data: { action: 'userEvent.click' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
userEvent.click(button);
        await waitFor(() => {
          expect(screen.getByText('Result')).toBeInTheDocument();
        });
      `
    },

    // Test setState method call with state assertion (covers lines 305-324)
    {
      code: `
        component.setState({ value: 42 });
        expect(component.state.value).toBe(42);
      `,
      filename: 'StateBlockError.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'component.setState' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
component.setState({ value: 42 });
        await waitFor(() => {
          expect(component.state.value).toBe(42);
        });
      `
    },

    // Test commit method with store state assertion
    {
      code: `
        store.commit('SET_VALUE', 42);
        expect(store.state.value).toBe(42);
      `,
      filename: 'CommitStateAssertion.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'store.commit' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
store.commit('SET_VALUE', 42);
        await waitFor(() => {
          expect(store.state.value).toBe(42);
        });
      `
    },

    // Test setProps with props assertion
    {
      code: `
        wrapper.setProps({ value: 100 });
        expect(wrapper.props().value).toBe(100);
      `,
      filename: 'SetPropsAssertion.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'wrapper.setProps' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
wrapper.setProps({ value: 100 });
        await waitFor(() => {
          expect(wrapper.props().value).toBe(100);
        });
      `
    },


    // Test lines 305-324: setState/dispatch/commit/setProps with state/store/props checks
    {
      code: `
        component.setState({ value: 'new' });
        expect(component.state.value).toBe('new');
      `,
      filename: 'SetStateCheck.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'component.setState' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
component.setState({ value: 'new' });
        await waitFor(() => {
          expect(component.state.value).toBe('new');
        });
      `
    },
    {
      code: `
        store.dispatch(updateAction());
        expect(store.getState()).toEqual({ updated: true });
      `,
      filename: 'DispatchStoreCheck.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'store.dispatch' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
store.dispatch(updateAction());
        await waitFor(() => {
          expect(store.getState()).toEqual({ updated: true });
        });
      `
    },
    {
      code: `
        vuexStore.commit('SET_VALUE', 'new');
        expect(vuexStore.state.value).toBe('new');
      `,
      filename: 'CommitCheck.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'vuexStore.commit' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
vuexStore.commit('SET_VALUE', 'new');
        await waitFor(() => {
          expect(vuexStore.state.value).toBe('new');
        });
      `
    },
    {
      code: `
        wrapper.setProps({ value: 100 });
        expect(wrapper.props().value).toBe(100);
      `,
      filename: 'SetPropsCheck.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'wrapper.setProps' }
      }],
      output: `
        import { waitFor } from '@testing-library/react';
wrapper.setProps({ value: 100 });
        await waitFor(() => {
          expect(wrapper.props().value).toBe(100);
        });
      `
    },

    // Playwright framework: uses framework-specific message (no fix)
    {
      code: `import { test, expect } from '@playwright/test';
fireEvent.click(button);
expect(screen.getByText('Clicked')).toBeInTheDocument();`,
      filename: 'PlaywrightImmediate.spec.js',
      errors: [{
        messageId: 'needsWaitForPlaywright',
        data: { action: 'fireEvent.click' }
      }]
    },

    // Cypress framework: uses framework-specific message (no fix)
    {
      code: `import { mount } from 'cypress/react';
fireEvent.click(button);
expect(screen.getByText('Clicked')).toBeInTheDocument();`,
      filename: 'CypressImmediate.cy.js',
      errors: [{
        messageId: 'needsWaitForCypress',
        data: { action: 'fireEvent.click' }
      }]
    }


  ]
});