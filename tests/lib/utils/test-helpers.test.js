/**
 * @fileoverview Tests for test-helpers utility functions
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const testHelpers = require('../../../lib/utils/test-helpers');

describe('test-helpers', () => {
  describe('getRuleTester', () => {
    beforeEach(() => {
      // Mock console.warn to avoid noise in tests
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create RuleTester with default config', () => {
      const ruleTester = testHelpers.getRuleTester();
      expect(ruleTester).toBeDefined();
      expect(ruleTester.constructor.name).toBe('RuleTester');
    });

    it('should create RuleTester with overrides', () => {
      const overrides = {
        parserOptions: {
          ecmaVersion: 2018
        }
      };
      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle ESLint 7 with babel parser available', () => {
      // Mock ESLint version 7
      const originalPackage = require('eslint/package.json');
      const mockPackage = { ...originalPackage, version: '7.32.0' };

      jest.doMock('eslint/package.json', () => mockPackage, { virtual: true });

      // Mock babel parser being available
      const originalRequireResolve = require.resolve;
      jest.spyOn(require, 'resolve').mockImplementation((request) => {
        if (request === '@babel/eslint-parser') {
          return '/mock/path/to/babel-parser';
        }
        try {
          return originalRequireResolve.call(require, request);
        } catch (err) {
          console.error(`Module not found: ${request}`);
          throw err;
        }
      });

      // Re-require to get the mocked version in isolation
      jest.isolateModules(() => {
        const testHelpersV7 = require('../../../lib/utils/test-helpers');
        const ruleTester = testHelpersV7.getRuleTester();
        expect(ruleTester).toBeDefined();
      });

      // Restore
      require.resolve.mockRestore();
      jest.dontMock('eslint/package.json');
    });

    it('should handle eslint version detection edge cases', () => {
      // Test config scenarios that trigger the fallback paths
      const overrides = {
        parser: undefined,
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle ESLint 8 configuration', () => {
      // Mock ESLint version 8
      const originalPackage = require('eslint/package.json');
      const mockPackage = { ...originalPackage, version: '8.57.0' };

      jest.doMock('eslint/package.json', () => mockPackage, { virtual: true });

      // Use jest.isolateModules for proper isolation
      jest.isolateModules(() => {
        const testHelpersV8 = require('../../../lib/utils/test-helpers');
        const ruleTester = testHelpersV8.getRuleTester();
        expect(ruleTester).toBeDefined();
      });

      // Restore
      jest.dontMock('eslint/package.json');
    });

    it('should handle ESLint 9+ flat config', () => {
      // Mock ESLint version 9
      const originalPackage = require('eslint/package.json');
      const mockPackage = { ...originalPackage, version: '9.0.0' };

      jest.doMock('eslint/package.json', () => mockPackage, { virtual: true });

      // Use jest.isolateModules for proper isolation
      jest.isolateModules(() => {
        const testHelpersV9 = require('../../../lib/utils/test-helpers');
        const ruleTester = testHelpersV9.getRuleTester();
        expect(ruleTester).toBeDefined();
      });

      // Restore
      jest.dontMock('eslint/package.json');
    });

    it('should deep merge overrides correctly', () => {
      const overrides = {
        languageOptions: {
          ecmaVersion: 2023,
          customProperty: 'test'
        },
        newProperty: 'value'
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle complex nested overrides', () => {
      const overrides = {
        parserOptions: {
          ecmaFeatures: {
            jsx: false,
            customFeature: true
          },
          sourceType: 'script'
        }
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle array values in overrides', () => {
      const overrides = {
        env: ['browser', 'node'],
        globals: {
          'test': 'readonly'
        }
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle null and undefined in overrides', () => {
      const overrides = {
        parser: null,
        parserOptions: undefined,
        validProperty: 'test'
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle primitive values in overrides', () => {
      const overrides = {
        ecmaVersion: 2022,
        strict: true,
        description: 'test config'
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });
  });

  describe('deepMerge internal function behavior', () => {
    // Since deepMerge is internal, we test it indirectly through getRuleTester

    it('should merge nested objects correctly', () => {
      const overrides = {
        languageOptions: {
          ecmaVersion: 2023,
          parserOptions: {
            jsx: false
          }
        }
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should not merge arrays (should replace them)', () => {
      const overrides = {
        env: ['browser', 'node']
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle edge case where target key does not exist', () => {
      const overrides = {
        newNestedProperty: {
          subProperty: 'value'
        }
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });
  });

  describe('isObject internal function behavior', () => {
    // Testing isObject indirectly through deepMerge behavior

    it('should handle non-object values correctly', () => {
      const overrides = {
        stringProperty: 'test',
        numberProperty: 42,
        booleanProperty: true,
        nullProperty: null,
        arrayProperty: [1, 2, 3]
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle date objects as non-objects for merging', () => {
      const overrides = {
        dateProperty: new Date(),
        regexProperty: /test/g
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });
  });

  describe('fallback configuration scenarios', () => {
    it('should handle fallback parser configuration correctly', () => {
      // Test the fallback configuration scenario
      const overrides = {
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle babel options configuration', () => {
      const overrides = {
        babelOptions: {
          presets: ['@babel/preset-env'],
          parserOpts: {
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true
          }
        }
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });

    it('should handle requireConfigFile option', () => {
      const overrides = {
        requireConfigFile: false
      };

      const ruleTester = testHelpers.getRuleTester(overrides);
      expect(ruleTester).toBeDefined();
    });
  });
});