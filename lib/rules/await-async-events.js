/**
 * @fileoverview Rule to enforce awaiting async user events
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, getFilename, findEnclosingFunction, ensureAsyncFunction } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce awaiting async user events and actions',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/await-async-events.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          customAsyncMethods: {
            type: 'array',
            items: { type: 'string' },
            default: []
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingAwait: '{{method}} must be awaited to prevent race conditions',
      missingAwaitFireEvent: 'fireEvent.{{method}} should be awaited',
      missingAwaitUserEvent: 'userEvent.{{method}} must be awaited',
      missingAwaitAct: 'act() with async callback must be awaited',
      missingAwaitPage: 'Playwright page.{{method}} must be awaited',
      missingAwaitElement: 'Element interaction {{method}} must be awaited'
    }
  },

  create(context) {
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
      return {};
    }

    const options = context.options[0] || {};
    const customAsyncMethods = options.customAsyncMethods || [];

    // Track variables that are assigned from userEvent.setup()
    const userEventVariables = new Set();

    // Methods that should always be awaited
    const asyncUserEventMethods = [
      'click', 'dblClick', 'tripleClick', 'type', 'clear',
      'selectOptions', 'deselectOptions', 'upload', 'tab',
      'hover', 'unhover', 'paste', 'keyboard'
    ];
    
    const asyncFireEventMethods = [
      'click', 'change', 'input', 'submit', 'focus', 'blur',
      'keyDown', 'keyUp', 'keyPress', 'mouseDown', 'mouseUp'
    ];
    
    const asyncPageMethods = [
      'click', 'fill', 'type', 'press', 'check', 'uncheck',
      'selectOption', 'setInputFiles', 'focus', 'hover', 'tap',
      'dragAndDrop', 'goto', 'reload', 'waitForSelector',
      'waitForTimeout', 'waitForLoadState', 'screenshot', 'newPage'
    ];
    
    const asyncElementMethods = [
      'click', 'focus', 'blur', 'submit', 'type'
    ];

    function isPromiseHandled(node) {
      let parent = node.parent;
      
      // Check if the call is awaited
      if (parent && parent.type === 'AwaitExpression') {
        return true;
      }
      
      // Check if it's part of a return statement
      if (parent && parent.type === 'ReturnStatement') {
        return true;
      }
      
      // Check if .then() or .catch() is called
      if (parent && parent.type === 'MemberExpression' && 
          parent.parent && parent.parent.type === 'CallExpression') {
        const prop = parent.property;
        if (prop && (prop.name === 'then' || prop.name === 'catch')) {
          return true;
        }
      }
      
      // Check if inside expect().rejects or expect().resolves
      if (parent && parent.type === 'CallExpression' &&
          parent.callee && parent.callee.name === 'expect') {
        const grandparent = parent.parent;
        if (grandparent && grandparent.type === 'MemberExpression' &&
            grandparent.property &&
            (grandparent.property.name === 'rejects' || grandparent.property.name === 'resolves')) {
          return true;
        }
      }

      // Check if assigned to a variable that might be awaited later
      if (parent && parent.type === 'VariableDeclarator') {
        // This is a bit lenient but prevents false positives
        return true;
      }

      return false;
    }

    function checkUserEvent(node) {
      if (node.callee.type === 'MemberExpression') {
        const objectName = node.callee.object.name;
        const methodName = node.callee.property.name;

        // Check direct userEvent calls or calls on tracked variables
        if ((objectName === 'userEvent' || userEventVariables.has(objectName)) &&
            asyncUserEventMethods.includes(methodName) &&
            !isPromiseHandled(node)) {

          context.report({
            node,
            messageId: 'missingAwaitUserEvent',
            data: { method: methodName },
            fix(fixer) {
              const funcNode = findEnclosingFunction(node);
              const asyncFixes = ensureAsyncFunction(fixer, funcNode);
              if (asyncFixes === null) return null;
              return [
                fixer.insertTextBefore(node, 'await '),
                ...asyncFixes
              ];
            }
          });
        }
      }
    }

    function checkFireEvent(node) {
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'fireEvent') {
        
        const methodName = node.callee.property.name;
        if (asyncFireEventMethods.includes(methodName) && 
            !isPromiseHandled(node)) {
          
          context.report({
            node,
            messageId: 'missingAwaitFireEvent',
            data: { method: methodName },
            fix(fixer) {
              const funcNode = findEnclosingFunction(node);
              const asyncFixes = ensureAsyncFunction(fixer, funcNode);
              if (asyncFixes === null) return null;
              return [
                fixer.insertTextBefore(node, 'await '),
                ...asyncFixes
              ];
            }
          });
        }
      }
    }

    function checkAct(node) {
      if (node.callee.name === 'act' && node.arguments[0]) {
        const callback = node.arguments[0];
        
        // Check if callback is async
        if (callback.async || 
            (callback.type === 'ArrowFunctionExpression' && callback.async) ||
            (callback.type === 'FunctionExpression' && callback.async)) {
          
          if (!isPromiseHandled(node)) {
            context.report({
              node,
              messageId: 'missingAwaitAct',
              fix(fixer) {
                const funcNode = findEnclosingFunction(node);
                const asyncFixes = ensureAsyncFunction(fixer, funcNode);
                if (asyncFixes === null) return null;
                return [
                  fixer.insertTextBefore(node, 'await '),
                  ...asyncFixes
                ];
              }
            });
          }
        }
      }
    }

    function checkPlaywright(node) {
      // Check for page.method() or browser.method()
      if (node.callee.type === 'MemberExpression') {
        const objectName = node.callee.object.name;
        const methodName = node.callee.property.name;
        
        if ((objectName === 'page' || objectName === 'browser' || 
             objectName === 'context' || objectName === 'frame') &&
            asyncPageMethods.includes(methodName) && 
            !isPromiseHandled(node)) {
          
          context.report({
            node,
            messageId: 'missingAwaitPage',
            data: { method: methodName },
            fix(fixer) {
              const funcNode = findEnclosingFunction(node);
              const asyncFixes = ensureAsyncFunction(fixer, funcNode);
              if (asyncFixes === null) return null;
              return [
                fixer.insertTextBefore(node, 'await '),
                ...asyncFixes
              ];
            }
          });
        }
      }
    }

    function checkElementMethods(node) {
      // Check for element.click(), element.focus(), etc.
      if (node.callee.type === 'MemberExpression') {
        const methodName = node.callee.property.name;
        
        // Check if it looks like a DOM element method
        if (asyncElementMethods.includes(methodName)) {
          const objectText = context.getSourceCode().getText(node.callee.object);
          
          // Common patterns for element references
          if (/element|button|input|link|field|checkbox|radio/i.test(objectText) ||
              /getBy|queryBy|findBy|screen\./i.test(objectText)) {
            
            if (!isPromiseHandled(node)) {
              context.report({
                node,
                messageId: 'missingAwaitElement',
                data: { method: methodName },
                fix(fixer) {
                  const funcNode = findEnclosingFunction(node);
                  const asyncFixes = ensureAsyncFunction(fixer, funcNode);
                  if (asyncFixes === null) return null;
                  return [
                    fixer.insertTextBefore(node, 'await '),
                    ...asyncFixes
                  ];
                }
              });
            }
          }
        }
      }
    }

    function checkCustomMethods(node) {
      if (customAsyncMethods.length > 0 && 
          node.callee.type === 'Identifier' &&
          customAsyncMethods.includes(node.callee.name) &&
          !isPromiseHandled(node)) {
        
        context.report({
          node,
          messageId: 'missingAwait',
          data: { method: node.callee.name },
          fix(fixer) {
            const funcNode = findEnclosingFunction(node);
            const asyncFixes = ensureAsyncFunction(fixer, funcNode);
            if (asyncFixes === null) return null;
            return [
              fixer.insertTextBefore(node, 'await '),
              ...asyncFixes
            ];
          }
        });
      }
    }

    return {
      VariableDeclarator(node) {
        // Track variables assigned from userEvent.setup()
        if (node.init &&
            node.init.type === 'CallExpression' &&
            node.init.callee.type === 'MemberExpression' &&
            node.init.callee.object.name === 'userEvent' &&
            node.init.callee.property.name === 'setup' &&
            node.id && node.id.name) {
          userEventVariables.add(node.id.name);
        }
        // Also track await userEvent.setup()
        if (node.init &&
            node.init.type === 'AwaitExpression' &&
            node.init.argument &&
            node.init.argument.type === 'CallExpression' &&
            node.init.argument.callee.type === 'MemberExpression' &&
            node.init.argument.callee.object.name === 'userEvent' &&
            node.init.argument.callee.property.name === 'setup' &&
            node.id && node.id.name) {
          userEventVariables.add(node.id.name);
        }
      },
      CallExpression(node) {
        checkUserEvent(node);
        checkFireEvent(node);
        checkAct(node);
        checkPlaywright(node);
        checkElementMethods(node);
        checkCustomMethods(node);
      }
    };
  }
};