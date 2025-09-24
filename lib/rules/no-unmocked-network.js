/**
 * @fileoverview Rule to ensure network calls are mocked in tests
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const { isTestFile, isInMockContext, isDataUrl, getFilename, escapeRegex } = require('../utils/helpers');

// Constants for network libraries and HTTP methods
const ALWAYS_FLAG_LIBRARIES = ['request', 'superagent', 'got', 'node-fetch'];
const CONDITIONAL_LIBRARIES = ['http', 'https'];
const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'request', 'head', 'options'];
const JQUERY_AJAX_METHODS = ['ajax', 'get', 'post', 'put', 'delete', 'patch', 'getJSON', 'load'];

// Regex patterns for detecting API-related variable names
// These patterns match common variable names that likely contain network URLs
const API_VARIABLE_PATTERNS = {
  // Matches 'api' but not 'apiKey', 'apis', or words like 'apiary'
  api: /\bapi(?!Key|s\b|[a-z])/i,

  // Matches 'endpoint'
  endpoint: /\bendpoint/i,

  // Matches 'url' but not 'urls' (plural form) or compound forms like 'urlString'
  url: /\burl(?!s\b|[a-z])/i,

  // Matches 'host' but not 'hostname' (system property)
  host: /\bhost(?!name\b)/i,

  // Matches 'domain' but not 'domains' (plural) or other suffixes
  domain: /\bdomain(?!s\b|[a-z])/i
};

// Combined regex for all API-related patterns
const COMBINED_API_PATTERN = new RegExp(
  Object.values(API_VARIABLE_PATTERNS)
    .map(regex => regex.source)
    .join('|'),
  'i'
);

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
          allowInIntegration: {
            type: 'boolean',
            default: false,
            description: 'Allow network requests in integration test files'
          },
          allowLocalhost: {
            type: 'boolean',
            default: true,
            description: 'Allow requests to localhost and local development servers'
          },
          allowedDomains: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Array of domain names that are allowed for network requests'
          },
          mockModules: {
            type: 'array',
            items: { type: 'string' },
            default: ['axios', 'fetch', 'request', 'http', 'https'],
            description: 'Array of modules that should be mocked instead of making real requests'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      mockNetwork: 'Network call using {{method}} should be mocked in tests',
      avoidExternalAPI: 'Avoid external API calls in tests. Use mock data instead.'
    }
  },

  create(context) {
    const filename = getFilename(context);
    if (!isTestFile(filename)) {
      return {};
    }

    const options = context.options[0] || {};
    const allowInIntegration = options.allowInIntegration || false;
    const allowLocalhost = options.allowLocalhost !== false; // Default is true
    const allowedDomains = options.allowedDomains || [];
    const mockModules = options.mockModules || ['axios', 'fetch', 'request', 'http', 'https'];
    const sourceCode = context.getSourceCode();

    // Check if this is an integration test file
    const isIntegrationTest = allowInIntegration &&
      (filename.includes('integration') || filename.includes('e2e') || filename.includes('end-to-end'));

    if (isIntegrationTest) {
      return {};
    }

    function isAllowedUrl(url) {
      if (!url) return false;

      // Check if it's a data URL or local file
      if (isDataUrl(url) || url.startsWith('file://')) {
        return true;
      }

      // Allow localhost and 127.0.0.1 based on option
      if (allowLocalhost && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
        return true;
      }

      // Check allowed domains
      return allowedDomains.some(domain => url.includes(domain));
    }

    function isModuleMocked(_node) {
      const text = sourceCode.getText();

      // Build patterns dynamically based on mockModules option
      const mockPatterns = [];

      // Add patterns for each module that should be mocked
      mockModules.forEach(module => {
        // Escape special regex characters in module name
        const escapedModule = escapeRegex(module);

        // Jest and Vitest mock patterns
        mockPatterns.push(
          new RegExp(`jest\\.mock\\s*\\(\\s*["']${escapedModule}["']\\s*\\)`),
          new RegExp(`vi\\.mock\\s*\\(\\s*["']${escapedModule}["']\\s*\\)`)
        );

        // Special handling for fetch
        if (module === 'fetch') {
          mockPatterns.push(
            /global\.fetch\s*=\s*jest\.fn/,
            /vi\.stubGlobal\s*\(\s*["']fetch["']/,
            /jest\.spyOn\s*\(\s*global\s*,\s*["']fetch["']\s*\)/
          );
        }
      });

      // Add pattern for node-fetch specifically since it's commonly used for fetch
      if (mockModules.includes('fetch')) {
        mockPatterns.push(
          /jest\.mock\s*\(\s*["']node-fetch["']\s*\)/,
          /vi\.mock\s*\(\s*["']node-fetch["']\s*\)/
        );
      }

      // Always check for common mocking libraries
      mockPatterns.push(
        /import.*from.*["']nock["']/,
        /require\s*\(\s*["']nock["']\s*\)/,
        /import.*from.*["']fetch-mock["']/,
        /require\s*\(\s*["']fetch-mock["']\s*\)/,
        /jest\.mock\s*\(\s*["']ws["']\s*\)/,
        /vi\.mock\s*\(\s*["']ws["']\s*\)/
      );

      return mockPatterns.some(pattern => pattern.test(text));
    }

    function isExternalAPI(url) {
      if (typeof url !== 'string') return false;

      const externalAPIPatterns = [
        /jsonplaceholder\.typicode\.com/,
        /api\.github\.com/
      ];

      return externalAPIPatterns.some(pattern => pattern.test(url));
    }

    return {
      CallExpression(node) {
        // Skip if in mock context
        if (isInMockContext(node, context) || isModuleMocked(node)) {
          return;
        }

        const callee = node.callee;

        // Handle fetch calls (only if fetch is in mockModules)
        if (mockModules.includes('fetch') &&
            ((callee.name === 'fetch') ||
            (callee.type === 'MemberExpression' &&
             callee.property && callee.property.name === 'fetch'))) {

          const urlArg = node.arguments[0];
          if (urlArg && urlArg.type === 'Literal' && typeof urlArg.value === 'string') {
            const url = urlArg.value;
            if (!isAllowedUrl(url) && (/^https?:\/\//.test(url) || url.startsWith('/'))) {
              if (isExternalAPI(url)) {
                context.report({
                  node,
                  messageId: 'avoidExternalAPI'
                });
              } else {
                context.report({
                  node,
                  messageId: 'mockNetwork',
                  data: { method: 'fetch' }
                });
              }
            }
          } else if (urlArg && (urlArg.type === 'Identifier' || urlArg.type === 'MemberExpression')) {
            // Dynamic URL - check if variable name suggests it contains a network URL
            const text = sourceCode.getText(urlArg);

            // Use the API_VARIABLE_PATTERNS.url regex to check for 'url' identifier (case-insensitive, not plural)
            if (urlArg.type === 'Identifier' && API_VARIABLE_PATTERNS.url.test(text)) {
              context.report({
                node,
                messageId: 'mockNetwork',
                data: { method: 'fetch' }
              });
            } else if (COMBINED_API_PATTERN.test(text)) {
              // Check if variable name matches any of our API-related patterns
              context.report({
                node,
                messageId: 'mockNetwork',
                data: { method: 'fetch' }
              });
            }
          }
          return;
        }

        // Handle axios calls
        if (callee.type === 'MemberExpression') {
          const obj = callee.object;

          // axios.get, axios.post, etc. (only if axios is in mockModules)
          if (mockModules.includes('axios') && obj.name === 'axios') {
            const method = callee.property.name;

            if (HTTP_METHODS.includes(method)) {
              // Check for external API calls
              const urlArg = node.arguments[0];
              if (urlArg && urlArg.type === 'Literal' && typeof urlArg.value === 'string') {
                const url = urlArg.value;
                if (isExternalAPI(url)) {
                  context.report({
                    node,
                    messageId: 'avoidExternalAPI'
                  });
                  return;
                }
                // Don't flag localhost URLs
                if (isAllowedUrl(url)) {
                  return;
                }
              }

              context.report({
                node,
                messageId: 'mockNetwork',
                data: { method: 'axios' }
              });
            }
            return;
          }

          // jQuery AJAX methods
          if ((obj.name === '$' || obj.name === 'jQuery') &&
              JQUERY_AJAX_METHODS.includes(callee.property.name)) {

            context.report({
              node,
              messageId: 'mockNetwork',
              data: { method: 'ajax' }
            });
            return;
          }

          // HTTP modules (http.get, https.get, etc.)
          const objText = sourceCode.getText(obj);
          const method = callee.property.name;

          // Check if it's an always-flag library or a conditional library in mockModules
          const isAlwaysFlag = ALWAYS_FLAG_LIBRARIES.some(lib => objText.includes(lib));
          const isConditionalFlag = CONDITIONAL_LIBRARIES.some(lib => objText.includes(lib) && mockModules.includes(lib));

          if ((isAlwaysFlag || isConditionalFlag) && HTTP_METHODS.includes(method)) {
            context.report({
              node,
              messageId: 'mockNetwork',
              data: { method: objText.split('.')[0] || 'http' }
            });
            return;
          }
        }

        // Handle direct axios call: axios({ method: "get", url: "/api" }) (only if axios is in mockModules)
        if (mockModules.includes('axios') && callee.name === 'axios') {
          context.report({
            node,
            messageId: 'mockNetwork',
            data: { method: 'axios' }
          });
          return;
        }

        // Handle direct function calls (got, etc.) - always flag dedicated HTTP clients
        if (callee.name === 'got') {
          context.report({
            node,
            messageId: 'mockNetwork',
            data: { method: 'got' }
          });
        }
      },

      NewExpression(node) {
        // Skip if in mock context
        if (isInMockContext(node, context) || isModuleMocked(node)) {
          return;
        }

        // Handle XMLHttpRequest
        if (node.callee.name === 'XMLHttpRequest') {
          context.report({
            node,
            messageId: 'mockNetwork',
            data: { method: 'XMLHttpRequest' }
          });
        }

        // Handle WebSocket
        if (node.callee.name === 'WebSocket') {
          const urlArg = node.arguments[0];
          if (urlArg) {
            if (urlArg.type === 'Literal') {
              const url = urlArg.value;
              if (typeof url === 'string' && /^wss?:\/\//.test(url)) {
                context.report({
                  node,
                  messageId: 'mockNetwork',
                  data: { method: 'WebSocket' }
                });
              }
            } else {
              // Dynamic URL
              context.report({
                node,
                messageId: 'mockNetwork',
                data: { method: 'WebSocket' }
              });
            }
          }
        }
      }
    };
  }
};