/**
 * Examples of no-global-state-mutation rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

/* eslint-disable no-undef */
/* eslint-disable no-global-assign */
/* eslint-disable test-flakiness/no-test-isolation */
/* eslint-disable test-flakiness/no-random-data */

// Note: These mocks are defined outside the test scope for demonstration purposes
// In real tests, global objects like window, document, global, process, console, navigator
// should already exist in the test environment (e.g., jsdom for browser tests)

describe('Global State Mutation Violations', () => {
  // ❌ BAD: Modifying window object
  it('should not modify window object', () => {
    window.globalVar = 'test value';
    window.config = { apiUrl: 'http://test.com' };
    window.localStorage.setItem('key', 'value');
    window.sessionStorage.setItem('session', 'data');

    expect(window.globalVar).toBe('test value');
  });

  // ❌ BAD: Modifying global object (Node.js)
  it('should not modify global object', () => {
    global.testConfig = { debug: true };
    global.mockData = [1, 2, 3];
    global.setTimeout = jest.fn(); // Modifying global functions

    expect(global.testConfig.debug).toBe(true);
  });

  // ❌ BAD: Modifying document object
  it('should not modify document properties', () => {
    document.title = 'Test Title';
    document.cookie = 'test=value';
    document.domain = 'test.com';
    document.body.className = 'test-class';

    expect(document.title).toBe('Test Title');
  });

  // ❌ BAD: Modifying process.env
  it('should not modify process.env', () => {
    process.env.NODE_ENV = 'test';
    process.env.API_KEY = 'secret';
    process.env.DEBUG = 'true';

    expect(process.env.NODE_ENV).toBe('test');
  });

  // ❌ BAD: Modifying Math object
  it('should not modify Math object', () => {
    Math.random = () => 0.5; // Overriding Math.random
    Math.customMethod = () => 42;

    expect(Math.random()).toBe(0.5);
  });

  // ❌ BAD: Modifying Date constructor
  it('should not modify Date', () => {
    const originalDate = Date;
    Date = jest.fn(() => new originalDate('2020-01-01'));
    Date.now = () => 1577836800000;

    expect(new Date().getFullYear()).toBe(2020);
  });

  // ❌ BAD: Modifying Array prototype
  it('should not modify prototypes', () => {
    Array.prototype.customMethod = function() {
      return this.length * 2;
    };

    Object.prototype.customProp = 'test';

    String.prototype.reverse = function() {
      return this.split('').reverse().join('');
    };

    expect([1, 2, 3].customMethod()).toBe(6);
  });

  // ❌ BAD: Modifying console object
  it('should not modify console', () => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = () => {};

    console.log('test');
    expect(console.log).toHaveBeenCalled();
  });

  // ❌ BAD: Modifying navigator object
  it('should not modify navigator', () => {
    // In Node.js test environment, navigator might not exist
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Custom User Agent',
        writable: true
      });

      navigator.onLine = false;

      expect(navigator.userAgent).toBe('Custom User Agent');
    }
  });

  // ❌ BAD: Creating global variables without cleanup
  it('should not create global variables', () => {
    globalThis.myGlobalVar = 'test';
    window.myApp = { initialized: true };
    global.cache = new Map();

    expect(globalThis.myGlobalVar).toBe('test');
    // No cleanup - affects other tests!
  });

  // ❌ BAD: Modifying module-level variables
  let moduleVariable = 'initial';
  const moduleConfig = { setting: 'default' };

  it('should not modify module variables', () => {
    moduleVariable = 'modified';
    moduleConfig.setting = 'changed';
    moduleConfig.newProp = 'added';

    expect(moduleVariable).toBe('modified');
    // These changes persist across tests!
  });

  // ❌ BAD: Modifying imported modules
  it('should not modify imported modules', () => {
    // Mock require for demonstration
    const require = (name) => {
      if (name === 'moment') {
        return { locale: function(lang) { this._locale = lang; return lang; }, _locale: 'en' };
      }
      if (name === 'lodash') {
        return {};
      }
    };

    const moment = require('moment');
    moment.locale('fr'); // Global change

    const lodash = require('lodash');
    lodash.customFunction = () => 'custom';

    expect(moment.locale()).toBe('fr');
  });
});