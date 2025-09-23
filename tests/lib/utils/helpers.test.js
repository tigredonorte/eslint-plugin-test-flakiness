/**
 * @fileoverview Tests for utility helper functions
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const helpers = require('../../../lib/utils/helpers');

describe('helpers', () => {
  describe('isTestFile', () => {
    it('should return false for non-test files', () => {
      expect(helpers.isTestFile('app.js')).toBe(false);
      expect(helpers.isTestFile('index.jsx')).toBe(false);
      expect(helpers.isTestFile('utils.ts')).toBe(false);
      expect(helpers.isTestFile('config.json')).toBe(false);
    });

    it('should return true for test files with .test extension', () => {
      expect(helpers.isTestFile('app.test.js')).toBe(true);
      expect(helpers.isTestFile('component.test.jsx')).toBe(true);
      expect(helpers.isTestFile('utils.test.ts')).toBe(true);
      expect(helpers.isTestFile('module.test.tsx')).toBe(true);
      expect(helpers.isTestFile('file.test.mjs')).toBe(true);
      expect(helpers.isTestFile('file.test.cjs')).toBe(true);
    });

    it('should return true for test files with .spec extension', () => {
      expect(helpers.isTestFile('app.spec.js')).toBe(true);
      expect(helpers.isTestFile('component.spec.jsx')).toBe(true);
      expect(helpers.isTestFile('utils.spec.ts')).toBe(true);
      expect(helpers.isTestFile('module.spec.tsx')).toBe(true);
    });

    it('should return true for story test files', () => {
      expect(helpers.isTestFile('Button.test.stories.js')).toBe(true);
      expect(helpers.isTestFile('Card.spec.stories.tsx')).toBe(true);
    });

    it('should return true for files in __tests__ directory', () => {
      expect(helpers.isTestFile('src/__tests__/app.js')).toBe(true);
      expect(helpers.isTestFile('path/__tests__/utils.ts')).toBe(true);
    });

    it('should return true for files in test/tests/spec/specs directories', () => {
      expect(helpers.isTestFile('src/test/app.js')).toBe(true);
      expect(helpers.isTestFile('src/tests/utils.ts')).toBe(true);
      expect(helpers.isTestFile('src/spec/component.jsx')).toBe(true);
      expect(helpers.isTestFile('src/specs/module.tsx')).toBe(true);
    });

    it('should return true for e2e and integration test files', () => {
      expect(helpers.isTestFile('app.e2e.js')).toBe(true);
      expect(helpers.isTestFile('flow.integration.ts')).toBe(true);
      expect(helpers.isTestFile('test.cy.js')).toBe(true);
    });

    it('should return true for files in cypress or playwright directories', () => {
      expect(helpers.isTestFile('/cypress/integration/app.js')).toBe(true);
      expect(helpers.isTestFile('tests/cypress/utils.ts')).toBe(true);
      expect(helpers.isTestFile('/playwright/tests/e2e.js')).toBe(true);
    });

    it('should return true for cucumber step definitions', () => {
      expect(helpers.isTestFile('login.steps.js')).toBe(true);
      expect(helpers.isTestFile('checkout.step.ts')).toBe(true);
    });

    it('should return false for null or undefined filename', () => {
      expect(helpers.isTestFile(null)).toBe(false);
      expect(helpers.isTestFile(undefined)).toBe(false);
      expect(helpers.isTestFile('')).toBe(false);
    });
  });

  describe('isInMockContext', () => {
    const createMockContext = () => ({
      getSourceCode: () => ({
        getText: (node) => {
          if (node && node.mockText) return node.mockText;
          if (node && node.name) return node.name;
          if (node && node.object && node.property) {
            return `${node.object.name}.${node.property.name}`;
          }
          return 'someFunction';
        }
      })
    });

    it('should detect jest mock calls', () => {
      const context = createMockContext();
      const node = {
        callee: {
          object: { name: 'jest' },
          property: { name: 'mock' },
          mockText: 'jest.mock'
        }
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect vitest mock calls', () => {
      const context = createMockContext();
      const node = {
        callee: {
          object: { name: 'vi' },
          property: { name: 'fn' },
          mockText: 'vi.fn'
        }
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect sinon mock calls', () => {
      const context = createMockContext();
      const node = {
        callee: {
          mockText: 'sinon.stub'
        }
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect mock/stub/spy/fake patterns', () => {
      const context = createMockContext();

      const mockNode = { callee: { mockText: 'mockFunction' } };
      expect(helpers.isInMockContext(mockNode, context)).toBe(true);

      const stubNode = { callee: { mockText: 'stubMethod' } };
      expect(helpers.isInMockContext(stubNode, context)).toBe(true);

      const spyNode = { callee: { mockText: 'spyOn' } };
      expect(helpers.isInMockContext(spyNode, context)).toBe(true);

      const fakeNode = { callee: { mockText: 'fakeTimer' } };
      expect(helpers.isInMockContext(fakeNode, context)).toBe(true);
    });

    it('should detect mock calls with member expressions', () => {
      const context = createMockContext();
      const node = {
        callee: {
          mockText: 'service.mockImplementation'
        }
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect mock context in parent nodes', () => {
      const context = createMockContext();
      const mockParent = {
        type: 'CallExpression',
        callee: { mockText: 'jest.mock' }
      };
      const node = {
        parent: mockParent
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect jest.mock() module mocking in parent', () => {
      const context = createMockContext();
      const mockParent = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'jest' },
          property: { name: 'mock' }
        }
      };
      const node = {
        parent: {
          parent: mockParent
        }
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect vi.mock() module mocking in parent', () => {
      const context = createMockContext();
      const mockParent = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'vi' },
          property: { name: 'mock' }
        }
      };
      const node = {
        parent: mockParent
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect mock in deeply nested parent', () => {
      const context = createMockContext();
      const mockGrandparent = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'jest' },
          property: { name: 'mock' }
        },
        parent: null
      };
      const middleParent = {
        type: 'BlockStatement',
        parent: mockGrandparent
      };
      const node = {
        parent: middleParent
      };
      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should detect jest.mock in parent when regex doesnt match', () => {
      const context = {
        getSourceCode: () => ({
          getText: (node) => {
            // Return text that doesn't match the regex but has the right structure
            if (node && node.type === 'MemberExpression') {
              return 'something.else';  // This won't match the regex
            }
            return 'otherFunction';
          }
        })
      };

      const mockGrandparent = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'jest' },
          property: { name: 'mock' }
        },
        parent: null
      };

      const node = {
        parent: mockGrandparent
      };

      expect(helpers.isInMockContext(node, context)).toBe(true);
    });

    it('should limit parent traversal to 5 levels', () => {
      const context = createMockContext();
      let deepNode = { parent: null };
      for (let i = 0; i < 10; i++) {
        deepNode = { parent: deepNode };
      }
      // Place mock context at 6th level (beyond limit)
      let current = deepNode;
      for (let i = 0; i < 6; i++) {
        current = current.parent;
      }
      current.type = 'CallExpression';
      current.callee = { mockText: 'jest.mock' };

      expect(helpers.isInMockContext(deepNode, context)).toBe(false);
    });

    it('should return false for non-mock contexts', () => {
      const context = createMockContext();
      const node = {
        callee: { mockText: 'regularFunction' }
      };
      expect(helpers.isInMockContext(node, context)).toBe(false);
    });

    it('should handle nodes without callee', () => {
      const context = createMockContext();
      const node = { type: 'Identifier' };
      expect(helpers.isInMockContext(node, context)).toBe(false);
    });
  });

  describe('isInHook', () => {
    it('should detect if node is in specified hooks', () => {
      const beforeEachParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'beforeEach' }
      };
      const node = { parent: beforeEachParent };

      expect(helpers.isInHook(node, ['beforeEach', 'afterEach'])).toBe(true);
      expect(helpers.isInHook(node, ['beforeAll', 'afterAll'])).toBe(false);
    });

    it('should detect hooks in nested parent structure', () => {
      const hookParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'afterAll' }
      };
      const node = {
        parent: {
          parent: {
            parent: hookParent
          }
        }
      };

      expect(helpers.isInHook(node, ['afterAll'])).toBe(true);
    });

    it('should return false when not in any hook', () => {
      const node = { parent: null };
      expect(helpers.isInHook(node, ['beforeEach', 'afterEach'])).toBe(false);
    });

    it('should handle non-CallExpression parents', () => {
      const node = {
        parent: {
          type: 'VariableDeclaration',
          parent: null
        }
      };
      expect(helpers.isInHook(node, ['beforeEach'])).toBe(false);
    });

    it('should handle callee that is not an Identifier', () => {
      const node = {
        parent: {
          type: 'CallExpression',
          callee: { type: 'MemberExpression' }
        }
      };
      expect(helpers.isInHook(node, ['beforeEach'])).toBe(false);
    });
  });

  describe('isInDescribe', () => {
    it('should detect if node is in describe block', () => {
      const describeParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'describe' }
      };
      const node = { parent: describeParent };

      expect(helpers.isInDescribe(node)).toBe(true);
    });

    it('should detect if node is in context block', () => {
      const contextParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'context' }
      };
      const node = { parent: contextParent };

      expect(helpers.isInDescribe(node)).toBe(true);
    });

    it('should detect if node is in suite block', () => {
      const suiteParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'suite' }
      };
      const node = { parent: suiteParent };

      expect(helpers.isInDescribe(node)).toBe(true);
    });

    it('should detect describe in nested parent structure', () => {
      const describeParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'describe' }
      };
      const node = {
        parent: {
          parent: {
            parent: describeParent
          }
        }
      };

      expect(helpers.isInDescribe(node)).toBe(true);
    });

    it('should return false when not in describe', () => {
      const node = { parent: null };
      expect(helpers.isInDescribe(node)).toBe(false);
    });

    it('should handle non-CallExpression parents', () => {
      const node = {
        parent: {
          type: 'VariableDeclaration',
          parent: null
        }
      };
      expect(helpers.isInDescribe(node)).toBe(false);
    });
  });

  describe('isInTest', () => {
    it('should detect if node is in it block', () => {
      const itParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'it' }
      };
      const node = { parent: itParent };

      expect(helpers.isInTest(node)).toBe(true);
    });

    it('should detect if node is in test block', () => {
      const testParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'test' }
      };
      const node = { parent: testParent };

      expect(helpers.isInTest(node)).toBe(true);
    });

    it('should detect if node is in specify block', () => {
      const specifyParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'specify' }
      };
      const node = { parent: specifyParent };

      expect(helpers.isInTest(node)).toBe(true);
    });

    it('should detect test in nested parent structure', () => {
      const testParent = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'test' }
      };
      const node = {
        parent: {
          parent: {
            parent: testParent
          }
        }
      };

      expect(helpers.isInTest(node)).toBe(true);
    });

    it('should return false when not in test', () => {
      const node = { parent: null };
      expect(helpers.isInTest(node)).toBe(false);
    });

    it('should handle non-CallExpression parents', () => {
      const node = {
        parent: {
          type: 'VariableDeclaration',
          parent: null
        }
      };
      expect(helpers.isInTest(node)).toBe(false);
    });

    it('should handle callee that is not an Identifier', () => {
      const node = {
        parent: {
          type: 'CallExpression',
          callee: { type: 'MemberExpression' }
        }
      };
      expect(helpers.isInTest(node)).toBe(false);
    });
  });

  describe('getFilename', () => {
    it('should get filename from ESLint 9+ context', () => {
      const context = { filename: '/path/to/test.js' };
      expect(helpers.getFilename(context)).toBe('/path/to/test.js');
    });

    it('should get filename from ESLint 8 getPhysicalFilename', () => {
      const context = {
        getPhysicalFilename: () => '/path/to/test.js'
      };
      expect(helpers.getFilename(context)).toBe('/path/to/test.js');
    });

    it('should get filename from ESLint 7 getFilename', () => {
      const context = {
        getFilename: () => '/path/to/test.js'
      };
      expect(helpers.getFilename(context)).toBe('/path/to/test.js');
    });

    it('should return empty string when no filename method available', () => {
      const context = {};
      expect(helpers.getFilename(context)).toBe('');
    });

    it('should prioritize ESLint 9 filename over legacy methods', () => {
      const context = {
        filename: '/path/v9/test.js',
        getPhysicalFilename: () => '/path/v8/test.js',
        getFilename: () => '/path/v7/test.js'
      };
      expect(helpers.getFilename(context)).toBe('/path/v9/test.js');
    });
  });

  describe('getTestFramework', () => {
    const createContext = (filename, text) => ({
      filename,
      getFilename: () => filename,
      getSourceCode: () => ({
        getText: () => text
      })
    });

    it('should detect testing-library', () => {
      const context = createContext(
        'test.js',
        'import { render } from "@testing-library/react"'
      );
      expect(helpers.getTestFramework(context)).toBe('testing-library');
    });

    it('should detect playwright', () => {
      const context = createContext(
        'test.js',
        'import { test } from "@playwright/test"'
      );
      expect(helpers.getTestFramework(context)).toBe('playwright');
    });

    it('should detect cypress from import', () => {
      const context = createContext(
        'test.js',
        'import cypress from "cypress"'
      );
      expect(helpers.getTestFramework(context)).toBe('cypress');
    });

    it('should detect vitest', () => {
      const context = createContext(
        'test.js',
        'import { test } from "vitest"'
      );
      expect(helpers.getTestFramework(context)).toBe('vitest');
    });

    it('should detect jest from import', () => {
      const context = createContext(
        'test.js',
        'import jest from "jest"'
      );
      expect(helpers.getTestFramework(context)).toBe('jest');
    });

    it('should detect vitest from global usage', () => {
      const context = createContext(
        'test.js',
        'describe("test", () => { vi.mock("module") })'
      );
      expect(helpers.getTestFramework(context)).toBe('vitest');
    });

    it('should detect jest from global usage', () => {
      const context = createContext(
        'test.js',
        'describe("test", () => { jest.fn() })'
      );
      expect(helpers.getTestFramework(context)).toBe('jest');
    });

    it('should detect cypress from global usage', () => {
      const context = createContext(
        'test.js',
        'describe("test", () => { cy.visit("/") })'
      );
      expect(helpers.getTestFramework(context)).toBe('cypress');
    });

    it('should detect cypress from file path', () => {
      const context = createContext(
        '/project/cypress/integration/test.js',
        'const test = "code"'
      );
      expect(helpers.getTestFramework(context)).toBe('cypress');
    });

    it('should detect playwright from file path', () => {
      const context = createContext(
        '/project/playwright/tests/test.js',
        'const test = "code"'
      );
      expect(helpers.getTestFramework(context)).toBe('playwright');
    });

    it('should detect cypress from .cy filename', () => {
      const context = createContext(
        'test.cy.js',
        'const test = "code"'
      );
      expect(helpers.getTestFramework(context)).toBe('cypress');
    });

    it('should default to jest for .spec files', () => {
      const context = createContext(
        'test.spec.js',
        'const test = "code"'
      );
      expect(helpers.getTestFramework(context)).toBe('jest');
    });

    it('should return null for unknown frameworks', () => {
      const context = createContext(
        'test.js',
        'const test = "code"'
      );
      expect(helpers.getTestFramework(context)).toBe(null);
    });

    it('should handle context without getFilename', () => {
      const context = {
        filename: 'test.cy.js',
        getSourceCode: () => ({
          getText: () => 'const test = "code"'
        })
      };
      expect(helpers.getTestFramework(context)).toBe('cypress');
    });
  });

  describe('isPromise', () => {
    it('should detect async functions', () => {
      const node = { async: true };
      expect(helpers.isPromise(node)).toBe(true);
    });

    it('should detect Promise constructor', () => {
      const node = {
        type: 'NewExpression',
        callee: { name: 'Promise' }
      };
      expect(helpers.isPromise(node)).toBe(true);
    });

    it('should detect promise methods', () => {
      const thenNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'then' }
        }
      };
      expect(helpers.isPromise(thenNode)).toBe(true);

      const catchNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'catch' }
        }
      };
      expect(helpers.isPromise(catchNode)).toBe(true);

      const finallyNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'finally' }
        }
      };
      expect(helpers.isPromise(finallyNode)).toBe(true);
    });

    it('should detect Promise static methods', () => {
      const allNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'all' }
        }
      };
      expect(helpers.isPromise(allNode)).toBe(true);

      const raceNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'race' }
        }
      };
      expect(helpers.isPromise(raceNode)).toBe(true);

      const allSettledNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'allSettled' }
        }
      };
      expect(helpers.isPromise(allSettledNode)).toBe(true);

      const anyNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'any' }
        }
      };
      expect(helpers.isPromise(anyNode)).toBe(true);

      const resolveNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'resolve' }
        }
      };
      expect(helpers.isPromise(resolveNode)).toBe(true);

      const rejectNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'reject' }
        }
      };
      expect(helpers.isPromise(rejectNode)).toBe(true);
    });

    it('should detect common async methods', () => {
      const fetchNode = {
        type: 'CallExpression',
        callee: { name: 'fetch' }
      };
      expect(helpers.isPromise(fetchNode)).toBe(true);

      const axiosNode = {
        type: 'CallExpression',
        callee: { name: 'axios' }
      };
      expect(helpers.isPromise(axiosNode)).toBe(true);

      const requestNode = {
        type: 'CallExpression',
        callee: { name: 'request' }
      };
      expect(helpers.isPromise(requestNode)).toBe(true);

      const getNode = {
        type: 'CallExpression',
        callee: { name: 'get' }
      };
      expect(helpers.isPromise(getNode)).toBe(true);

      const postNode = {
        type: 'CallExpression',
        callee: { name: 'POST' }
      };
      expect(helpers.isPromise(postNode)).toBe(true);

      const putNode = {
        type: 'CallExpression',
        callee: { name: 'Put' }
      };
      expect(helpers.isPromise(putNode)).toBe(true);

      const deleteNode = {
        type: 'CallExpression',
        callee: { name: 'DELETE' }
      };
      expect(helpers.isPromise(deleteNode)).toBe(true);

      const patchNode = {
        type: 'CallExpression',
        callee: { name: 'Patch' }
      };
      expect(helpers.isPromise(patchNode)).toBe(true);
    });

    it('should return false for non-promise nodes', () => {
      expect(helpers.isPromise(null)).toBe(false);
      expect(helpers.isPromise(undefined)).toBe(false);

      const regularFunction = { async: false };
      expect(helpers.isPromise(regularFunction)).toBe(false);

      const regularCall = {
        type: 'CallExpression',
        callee: { name: 'regularFunction' }
      };
      expect(helpers.isPromise(regularCall)).toBe(false);

      const nonPromiseMethod = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'map' }
        }
      };
      expect(helpers.isPromise(nonPromiseMethod)).toBe(false);
    });

    it('should handle nodes without callee property', () => {
      const node = { type: 'Identifier' };
      expect(helpers.isPromise(node)).toBe(false);
    });

    it('should handle CallExpression without name', () => {
      const node = {
        type: 'CallExpression',
        callee: { type: 'Identifier' }
      };
      expect(helpers.isPromise(node)).toBe(false);
    });
  });

  describe('getIndentation', () => {
    it('should get indentation for a node', () => {
      const node = {};
      const context = {
        getSourceCode: () => ({
          getFirstToken: () => ({ loc: { start: { line: 1 } } }),
          lines: ['    const test = 1;']
        })
      };
      expect(helpers.getIndentation(node, context)).toBe('    ');
    });

    it('should handle tabs', () => {
      const node = {};
      const context = {
        getSourceCode: () => ({
          getFirstToken: () => ({ loc: { start: { line: 1 } } }),
          lines: ['\t\tconst test = 1;']
        })
      };
      expect(helpers.getIndentation(node, context)).toBe('\t\t');
    });

    it('should handle mixed spaces and tabs', () => {
      const node = {};
      const context = {
        getSourceCode: () => ({
          getFirstToken: () => ({ loc: { start: { line: 1 } } }),
          lines: ['  \t  const test = 1;']
        })
      };
      expect(helpers.getIndentation(node, context)).toBe('  \t  ');
    });

    it('should handle no indentation', () => {
      const node = {};
      const context = {
        getSourceCode: () => ({
          getFirstToken: () => ({ loc: { start: { line: 1 } } }),
          lines: ['const test = 1;']
        })
      };
      expect(helpers.getIndentation(node, context)).toBe('');
    });

    it('should handle missing token', () => {
      const node = {};
      const context = {
        getSourceCode: () => ({
          getFirstToken: () => null,
          lines: ['const test = 1;']
        })
      };
      expect(helpers.getIndentation(node, context)).toBe('');
    });

    it('should handle line index correctly', () => {
      const node = {};
      const context = {
        getSourceCode: () => ({
          getFirstToken: () => ({ loc: { start: { line: 3 } } }),
          lines: [
            'line 1',
            'line 2',
            '      const test = 1;'
          ]
        })
      };
      expect(helpers.getIndentation(node, context)).toBe('      ');
    });

    it('should handle out of bounds line index', () => {
      const node = {};
      const context = {
        getSourceCode: () => ({
          getFirstToken: () => ({ loc: { start: { line: 5 } } }),
          lines: ['line 1', 'line 2']
        })
      };
      expect(helpers.getIndentation(node, context)).toBe('');
    });
  });

  describe('isUrl', () => {
    it('should detect http URLs', () => {
      expect(helpers.isUrl('http://example.com')).toBe(true);
      expect(helpers.isUrl('https://example.com')).toBe(true);
    });

    it('should detect websocket URLs', () => {
      expect(helpers.isUrl('ws://example.com')).toBe(true);
      expect(helpers.isUrl('wss://example.com')).toBe(true);
    });

    it('should detect protocol-relative URLs', () => {
      expect(helpers.isUrl('//example.com')).toBe(true);
    });

    it('should return false for non-URLs', () => {
      expect(helpers.isUrl('example.com')).toBe(false);
      expect(helpers.isUrl('file.txt')).toBe(false);
      expect(helpers.isUrl('/path/to/file')).toBe(false);
      expect(helpers.isUrl('C:\\Windows\\file.txt')).toBe(false);
      expect(helpers.isUrl('ftp://example.com')).toBe(false);
    });
  });

  describe('isDataUrl', () => {
    it('should detect data URLs', () => {
      expect(helpers.isDataUrl('data:text/plain;base64,SGVsbG8=')).toBe(true);
      expect(helpers.isDataUrl('data:image/png;base64,iVBORw0KG')).toBe(true);
    });

    it('should detect blob URLs', () => {
      expect(helpers.isDataUrl('blob:http://example.com/uuid')).toBe(true);
    });

    it('should detect file URLs', () => {
      expect(helpers.isDataUrl('file:///path/to/file')).toBe(true);
    });

    it('should return false for non-data URLs', () => {
      expect(helpers.isDataUrl('http://example.com')).toBe(false);
      expect(helpers.isDataUrl('https://example.com')).toBe(false);
      expect(helpers.isDataUrl('//example.com')).toBe(false);
      expect(helpers.isDataUrl('example.txt')).toBe(false);
    });
  });
});