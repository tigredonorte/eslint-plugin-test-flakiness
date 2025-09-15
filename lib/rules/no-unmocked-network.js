/**
 * @fileoverview Rule to ensure network calls are mocked in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext, isDataUrl } = require('../utils/helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure network calls are properly mocked in tests',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/tigredonorte/eslint-plugin-test-flakiness/blob/main/docs/rules/no-unmocked-network.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowedDomains: {
            type: 'array',
            items: { type: 'string' },
            default: []
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      unmockedFetch: 'Network call using {{method}} should be mocked in tests',
      unmockedAxios: 'Axios calls should be mocked in tests',
      unmockedHttp: 'HTTP requests should be mocked in tests',
      useTestData: 'Use local test data or mock server instead of real API calls'
    }
  },

  create(context) {
    if (!isTestFile(context.getFilename())) {
      return {};
    }

    const options = context.options[0] || {};
    const allowedDomains = options.allowedDomains || [];

    function isAllowedUrl(url) {
      if (!url) return false;
      
      // Check if it's a data URL or local file
      if (isDataUrl(url) || url.startsWith('file://')) {
        return true;
      }
      
      // Check allowed domains
      return allowedDomains.some(domain => url.includes(domain));
    }

    function checkFetch(node) {
      if (node.callee.name === 'fetch') {
        // Skip if in mock context
        if (isInMockContext(node, context)) {
          return;
        }
        
        // Check the URL argument
        const urlArg = node.arguments[0];
        if (urlArg) {
          if (urlArg.type === 'Literal') {
            const url = urlArg.value;
            if (typeof url === 'string' && !isAllowedUrl(url)) {
              // Check if it's a real HTTP URL
              if (/^https?:\/\//.test(url)) {
                context.report({
                  node,
                  messageId: 'unmockedFetch',
                  data: { method: 'fetch' }
                });
              }
            }
          } else if (urlArg.type === 'Identifier' || urlArg.type === 'MemberExpression') {
            // Dynamic URL - check if it looks like an API endpoint
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(urlArg);
            
            if (/api|endpoint|url|host|domain/i.test(text)) {
              context.report({
                node,
                messageId: 'unmockedFetch',
                data: { method: 'fetch' }
              });
            }
          }
        }
      }
    }

    function checkAxios(node) {
      if (node.callee.type === 'MemberExpression') {
        const obj = node.callee.object;
        
        // Check for axios.get, axios.post, etc.
        if (obj.name === 'axios' || 
            (obj.type === 'Identifier' && /axios/i.test(obj.name))) {
          
          if (!isInMockContext(node, context)) {
            const method = node.callee.property.name;
            const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'request', 'head', 'options'];
            
            if (httpMethods.includes(method)) {
              context.report({
                node,
                messageId: 'unmockedAxios'
              });
            }
          }
        }
      }
    }

    function checkHttpModules(node) {
      // Check for various HTTP client libraries
      if (node.callee.type === 'MemberExpression') {
        const sourceCode = context.getSourceCode();
        const objText = sourceCode.getText(node.callee.object);
        const method = node.callee.property.name;
        
        // Check for common HTTP libraries
        const httpLibraries = ['request', 'superagent', 'got', 'node-fetch', 'http', 'https'];
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'request'];
        
        if (httpLibraries.some(lib => objText.includes(lib)) && 
            httpMethods.includes(method)) {
          
          if (!isInMockContext(node, context)) {
            context.report({
              node,
              messageId: 'unmockedHttp'
            });
          }
        }
      }
    }

    function checkXMLHttpRequest(node) {
      // Check for XMLHttpRequest usage
      if (node.callee.name === 'XMLHttpRequest' && 
          node.type === 'NewExpression') {
        
        if (!isInMockContext(node, context)) {
          context.report({
            node,
            messageId: 'useTestData'
          });
        }
      }
    }

    function checkWebSocket(node) {
      // Check for WebSocket connections
      if (node.type === 'NewExpression' && 
          node.callee.name === 'WebSocket') {
        
        const urlArg = node.arguments[0];
        if (urlArg && urlArg.type === 'Literal') {
          const url = urlArg.value;
          if (typeof url === 'string' && /^wss?:\/\//.test(url)) {
            if (!isInMockContext(node, context)) {
              context.report({
                node,
                messageId: 'useTestData'
              });
            }
          }
        }
      }
    }

    return {
      CallExpression(node) {
        checkFetch(node);
        checkAxios(node);
        checkHttpModules(node);
      },
      NewExpression(node) {
        checkXMLHttpRequest(node);
        checkWebSocket(node);
      }
    };
  }
};
