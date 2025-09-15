/**
 * @fileoverview Tests for no-immediate-assertions rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-immediate-assertions');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

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
    }
  ]
});