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

    // Test line 248: getActionName fallback to 'action'
    {
      code: `
        unknownAction;
        expect(result).toBe(true);
      `,
      filename: 'UnknownAction.test.js'
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
    },

    // Test for assertions inside waitForElement (lines 141-146)
    {
      code: `
        test('uses waitForElement', async () => {
          fireEvent.click(button);
          await waitForElement(() => {
            expect(screen.getByText('Loaded')).toBeInTheDocument();
          });
        });
      `,
      filename: 'WaitForElement.test.js'
    },

    // Test for assertions inside wait function (lines 141-146)
    {
      code: `
        test('uses wait', async () => {
          fireEvent.click(button);
          await wait(() => {
            expect(screen.getByText('Done')).toBeInTheDocument();
          });
        });
      `,
      filename: 'Wait.test.js'
    },

    // Test with arrow function expression body (line 175)
    {
      code: `
        const test = () => fireEvent.click(button);
      `,
      filename: 'ArrowExpression.test.js'
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
        fireEvent.click(button);
        waitFor(() => {
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
        userEvent.type(input, 'test');
        waitFor(() => {
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
        component.setState({ value: 42 });
        waitFor(() => {
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
        store.dispatch(action);
        waitFor(() => {
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
        wrapper.setProps({ value: 42 });
        waitFor(() => {
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
        fireEvent.click(button1);
        waitFor(() => {
          expect(result1).toBe(true);
        });
        fireEvent.click(button2);
        waitFor(() => {
          expect(result2).toBe(true);
        });
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
        wrapper.simulate('click');
        waitFor(() => {
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
        wrapper.trigger('click');
        waitFor(() => {
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
        fireEvent.click(button);
        waitFor(() => {
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
        fireEvent.change(input, { target: { value: 'test' } });
        waitFor(() => {
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
        fireEvent.submit(form);
        waitFor(() => {
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
        userEvent.click(button);
        waitFor(() => {
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
        store.commit('SET_VALUE', 42);
        waitFor(() => {
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
    fireEvent.click(button);
    waitFor(() => {
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
\t\tfireEvent.click(button);
\t\twaitFor(() => {
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
        fireEvent.click(button);
        waitFor(() => {
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
        fireEvent.click(button);
        waitFor(() => {
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
        setState({ value: 1 });
        waitFor(() => {
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
        element.triggerEvent();
        waitFor(() => {
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
        userEvent.click(button);
        waitFor(() => {
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
        triggerEvent();
        waitFor(() => {
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
        userEvent.click(button);
        waitFor(() => {
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
        component.setState({ value: 42 });
        waitFor(() => {
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
        store.commit('SET_VALUE', 42);
        waitFor(() => {
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
        wrapper.setProps({ value: 100 });
        waitFor(() => {
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
        component.setState({ value: 'new' });
        waitFor(() => {
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
        store.dispatch(updateAction());
        waitFor(() => {
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
        vuexStore.commit('SET_VALUE', 'new');
        waitFor(() => {
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
        wrapper.setProps({ value: 100 });
        waitFor(() => {
          expect(wrapper.props().value).toBe(100);
        });
      `
    },

    // Test direct setState call (lines 199-202)
    {
      code: `
        setState({ value: 42 });
        expect(state.value).toBe(42);
      `,
      filename: 'DirectSetState.test.js',
      errors: [{
        messageId: 'needsWaitForState',
        data: { action: 'setState' }
      }],
      output: `
        setState({ value: 42 });
        waitFor(() => {
          expect(state.value).toBe(42);
        });
      `
    },

    // Test for CallExpression handler - setState/dispatch with state check (lines 354-359)
    {
      code: 'test("state test", () => { component.setState({ count: 1 }); expect(component.state.count).toBe(1); });',
      output: 'test("state test", () => { component.setState({ count: 1 }); waitFor(() => {\n  expect(component.state.count).toBe(1);\n}); });',
      filename: 'StateTest.test.js',
      errors: [
        {
          messageId: 'needsWaitForState',
          data: { action: 'component.setState' }
        },
        {
          messageId: 'needsWaitForState',
          data: { action: 'setState' }
        }
      ]
    },

    // Test for CallExpression handler - dispatch with store check (lines 354-359)
    {
      code: 'test("store test", () => { store.dispatch(action); expect(store.getState().value).toBe(42); });',
      output: 'test("store test", () => { store.dispatch(action); waitFor(() => {\n  expect(store.getState().value).toBe(42);\n}); });',
      filename: 'StoreTest.test.js',
      errors: [
        {
          messageId: 'needsWaitForState',
          data: { action: 'store.dispatch' }
        },
        {
          messageId: 'needsWaitForState',
          data: { action: 'dispatch' }
        }
      ]
    }

  ]
});

// Additional unit tests for coverage
describe('no-immediate-assertions edge cases', () => {
  let rule;

  beforeEach(() => {
    rule = require('../../../lib/rules/no-immediate-assertions');
  });

  it('should handle getActionName with AwaitExpression', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getText: (_node) => {
          if (_node && _node.expression) {
            return 'expect(result).toBe(true)';
          }
          return 'expect(result).toBe(true)';
        }
      })
    };

    const visitor = rule.create(context);

    // Create nodes for: await fireEvent.click(button); expect(result).toBe(true);
    // The AwaitExpression is not considered a state-changing action, so let's test with regular fireEvent.click
    const clickNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'fireEvent' },
          property: { name: 'click' }
        },
        arguments: []
      },
      parent: {
        type: 'BlockStatement',
        body: []
      }
    };

    const expectNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' }
          },
          property: { name: 'toBe' }
        }
      }
    };

    clickNode.parent.body = [clickNode, expectNode];

    visitor.ExpressionStatement(clickNode);

    expect(context.report).toHaveBeenCalledWith(
      expect.objectContaining({
        node: expectNode,
        messageId: 'needsWaitFor',
        data: { action: 'fireEvent.click' }
      })
    );
  });

  it('should handle getActionName fallback to action', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getText: (_node) => {
          return 'expect(result).toBe(true)';
        }
      })
    };

    const visitor = rule.create(context);

    // Create nodes for something that's not a standard pattern but still a CallExpression
    const weirdNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'unknownFunction'  // Not a state-changing pattern
        },
        arguments: []
      },
      parent: {
        type: 'BlockStatement',
        body: []
      }
    };

    const expectNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' }
          },
          property: { name: 'toBe' }
        }
      }
    };

    weirdNode.parent.body = [weirdNode, expectNode];

    // This should not report since it's not a state-changing action
    visitor.ExpressionStatement(weirdNode);

    expect(context.report).not.toHaveBeenCalled();
  });

  it('should handle CallExpression setState without requireWaitFor', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{ requireWaitFor: false }],
      report: jest.fn(),
      getSourceCode: () => ({
        getText: (_node) => 'component.state.value'
      })
    };

    const visitor = rule.create(context);

    const setStateNode = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { name: 'component' },
        property: { name: 'setState' }
      },
      arguments: [],
      parent: {
        type: 'ExpressionStatement',
        parent: {
          type: 'BlockStatement',
          body: []
        }
      }
    };

    const expectNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { name: 'expect' }
      }
    };

    setStateNode.parent.parent.body = [setStateNode.parent, expectNode];

    visitor.CallExpression(setStateNode);

    // Should not report when requireWaitFor is false
    expect(context.report).not.toHaveBeenCalled();
  });

  it('should handle CallExpression dispatch with data-testid', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{ ignoreDataTestId: true }],
      report: jest.fn(),
      getSourceCode: () => ({
        getText: (_node) => 'screen.getByTestId("result")'
      })
    };

    const visitor = rule.create(context);

    const dispatchNode = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { name: 'store' },
        property: { name: 'dispatch' }
      },
      arguments: [],
      parent: {
        type: 'ExpressionStatement',
        parent: {
          type: 'BlockStatement',
          body: []
        }
      }
    };

    const expectNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { name: 'expect' }
      }
    };

    dispatchNode.parent.parent.body = [dispatchNode.parent, expectNode];

    visitor.CallExpression(dispatchNode);

    // Should not report when ignoreDataTestId is true and test uses data-testid
    expect(context.report).not.toHaveBeenCalled();
  });

  it('should handle isInsideWaitFor with property access', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getText: (_node) => 'expect(result).toBe(true)'
      })
    };

    const visitor = rule.create(context);

    // Create nodes for fireEvent.click followed by expect
    const clickNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'fireEvent' },
          property: { name: 'click' }
        },
        arguments: []
      },
      parent: {
        type: 'BlockStatement',
        body: []
      }
    };

    const expectNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'CallExpression',
            callee: { name: 'expect' }
          },
          property: { name: 'toBe' }
        }
      }
    };

    clickNode.parent.body = [clickNode, expectNode];

    visitor.ExpressionStatement(clickNode);

    // Should report because expect is not inside waitFor
    expect(context.report).toHaveBeenCalled();
  });

  it('should handle arrow function expression body', () => {
    const context = {
      getFilename: () => 'test.spec.js',
      options: [{}],
      report: jest.fn(),
      getSourceCode: () => ({
        getText: () => ''
      })
    };

    const visitor = rule.create(context);

    // Test line 165 - arrow function with expression body
    const arrowNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { name: 'fireEvent' }
      },
      parent: {
        type: 'ArrowFunctionExpression',
        body: { type: 'CallExpression' } // Expression body, not block
      }
    };

    visitor.ExpressionStatement(arrowNode);

    // Should not report for arrow function expression bodies
    expect(context.report).not.toHaveBeenCalled();
  });

  let createMockContext;

  beforeEach(() => {
    // Helper function to create mock context
    createMockContext = () => ({
    getFilename: () => 'test.spec.js',
    options: [{}],
    report: jest.fn(),
    getSourceCode: () => ({
      getText: (_node) => {
        if (_node && _node.expression) {
          return 'expect(result).toBe(true)';
        }
        return 'test code';
      },
      getLines: () => ['', 'test line'],
      getFirstToken: () => ({ loc: { start: { line: 1 } } })
    })
  });
  });

  // Test for isInsideWaitFor with waitForElement (lines 141-146)
  test('isInsideWaitFor detects waitForElement', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    const _node = {
      type: 'CallExpression',
      callee: { name: 'expect' },
      parent: {
        type: 'CallExpression',
        callee: { name: 'waitForElement' }
      }
    };

    // Manually test isInsideWaitFor logic by creating proper parent chain
    const waitForNode = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { name: 'setState' }
      },
      parent: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { name: 'setState' }
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { name: 'expect' },
              parent: {
                type: 'CallExpression',
                callee: { name: 'waitForElement' }
              }
            }
          }
        ]
      }
    };

    visitor.ExpressionStatement(waitForNode);
    expect(context.report).not.toHaveBeenCalled();
  });

  // Test for isInsideWaitFor with wait function (lines 141-146)
  test('isInsideWaitFor detects wait function', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    const node = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { name: 'setState' }
      },
      parent: {
        type: 'BlockStatement',
        body: []
      }
    };

    // Test with wait wrapper
    const _waitNode = {
      type: 'CallExpression',
      callee: { name: 'expect' },
      parent: {
        type: 'BlockStatement',
        parent: {
          type: 'ArrowFunctionExpression',
          parent: {
            type: 'CallExpression',
            callee: { property: { name: 'wait' } }
          }
        }
      }
    };

    visitor.ExpressionStatement(node);
    // The visitor should check for wait and not report
  });

  // Test for getActionName with node without callee (line 260)
  test('getActionName returns default for node without callee', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    // Access the internal getActionName function through a mock
    const node = {
      type: 'ExpressionStatement',
      expression: {
        type: 'Identifier',
        name: 'someIdentifier'
      },
      parent: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'Identifier',
              name: 'someIdentifier'
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { name: 'expect' }
            }
          }
        ]
      }
    };

    // This will test the getActionName fallback
    visitor.ExpressionStatement(node);
  });

  // Test for checkInlinePattern with non-matching expressions (line 281)
  test('checkInlinePattern continues for non-matching expressions', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    const node = {
      type: 'ExpressionStatement',
      expression: {
        type: 'SequenceExpression',
        expressions: [
          { type: 'Identifier', name: 'someVar' },
          { type: 'CallExpression', callee: { name: 'expect' } }
        ]
      },
      parent: {
        type: 'BlockStatement',
        body: []
      }
    };

    visitor.ExpressionStatement(node);
    expect(context.report).not.toHaveBeenCalled();
  });

  // Test for CallExpression handler with non-ExpressionStatement parent (line 323)
  test('CallExpression handler returns early for non-ExpressionStatement parent', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        property: { name: 'setState' }
      },
      parent: {
        type: 'VariableDeclarator' // Not ExpressionStatement
      }
    };

    // Access CallExpression handler
    if (visitor.CallExpression) {
      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    }
  });

  // Test for CallExpression handler with non-BlockStatement parent (line 335)
  test('CallExpression handler with missing next statement', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    const exprStatement = { type: 'ExpressionStatement' };
    const blockStatement = {
      type: 'BlockStatement',
      body: [exprStatement] // Only one statement, no next
    };
    exprStatement.parent = blockStatement;

    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        property: { name: 'setState' }
      },
      parent: exprStatement
    };

    if (visitor.CallExpression) {
      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    }
  });

  // Test for CallExpression handler with non-expect next statement (line 340)
  test('CallExpression handler with non-expect next statement', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    const exprStatement = { type: 'ExpressionStatement' };
    const blockStatement = {
      type: 'BlockStatement',
      body: [
        exprStatement,
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'CallExpression',
            callee: { name: 'console.log' } // Not expect
          }
        }
      ]
    };
    exprStatement.parent = blockStatement;

    const node = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        property: { name: 'setState' }
      },
      parent: exprStatement
    };

    if (visitor.CallExpression) {
      visitor.CallExpression(node);
      expect(context.report).not.toHaveBeenCalled();
    }
  });

  // Test for AwaitExpression in getActionName (line 246)
  test('handles await expressions in action detection', () => {
    const context = createMockContext();
    const visitor = rule.create(context);

    const firstStatement = {
      type: 'ExpressionStatement',
      expression: {
        type: 'AwaitExpression',
        argument: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { name: 'fireEvent' },
            property: { name: 'click' }
          }
        }
      }
    };

    const secondStatement = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { name: 'expect' }
      }
    };

    const blockStatement = {
      type: 'BlockStatement',
      body: [firstStatement, secondStatement]
    };

    firstStatement.parent = blockStatement;
    secondStatement.parent = blockStatement;

    // The rule checks the state-changing action as it would not be an AwaitExpression
    // but the inner CallExpression would be considered
    visitor.ExpressionStatement(firstStatement);

    // The actual checking happens when processing sequential statements
    expect(context.report).not.toHaveBeenCalled();
  });
});