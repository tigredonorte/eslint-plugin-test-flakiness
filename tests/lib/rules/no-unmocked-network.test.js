/**
 * @fileoverview Tests for no-unmocked-network rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-unmocked-network');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-unmocked-network', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'fetch("https://api.example.com")',
      filename: 'src/app.js'
    },
    {
      code: 'axios.get("/api/users")',
      filename: 'src/api.js'
    },

    // Mocked fetch
    {
      code: 'jest.mock("node-fetch"); fetch("https://api.example.com")',
      filename: 'MockedFetch.test.js'
    },
    {
      code: 'global.fetch = jest.fn(); fetch("/api/data")',
      filename: 'GlobalFetch.test.js'
    },
    {
      code: 'vi.stubGlobal("fetch", vi.fn()); fetch("https://api.example.com")',
      filename: 'ViFetch.test.js'
    },

    // Mocked axios
    {
      code: 'jest.mock("axios"); axios.get("/api/users")',
      filename: 'MockedAxios.test.js'
    },
    {
      code: 'import MockAdapter from "axios-mock-adapter";\nconst mock = new MockAdapter(axios);',
      filename: 'AxiosMockAdapter.test.js'
    },

    // Using MSW (Mock Service Worker)
    {
      code: 'import { setupServer } from "msw/node";\nconst server = setupServer();',
      filename: 'MSW.test.js'
    },
    {
      code: 'import { rest } from "msw"; rest.get("/api/users", handler)',
      filename: 'MSWHandlers.test.js'
    },

    // Using nock
    {
      code: 'import nock from "nock"; nock("https://api.example.com").get("/users").reply(200)',
      filename: 'Nock.test.js'
    },
    {
      code: 'const nock = require("nock"); nock("http://localhost").post("/api").reply(201)',
      filename: 'NockRequire.test.js'
    },

    // Using fetch-mock
    {
      code: 'import fetchMock from "fetch-mock"; fetchMock.get("*", 200)',
      filename: 'FetchMock.test.js'
    },

    // Spied/stubbed network methods
    {
      code: 'jest.spyOn(global, "fetch").mockResolvedValue(response); fetch(url)',
      filename: 'SpiedFetch.test.js'
    },
    {
      code: 'sinon.stub(axios, "get").resolves({ data: [] }); axios.get("/api")',
      filename: 'StubbedAxios.test.js'
    },

    // Using test server
    {
      code: 'fetch("http://localhost:3001/test-endpoint")',
      filename: 'TestServer.test.js'
    },
    {
      code: 'axios.get("http://127.0.0.1:8080/test")',
      filename: 'LocalServer.test.js'
    },

    // WebSocket mocked
    {
      code: 'jest.mock("ws"); const WebSocket = require("ws"); new WebSocket(url)',
      filename: 'MockedWebSocket.test.js'
    },

    // Non-network operations
    {
      code: 'localStorage.getItem("key")',
      filename: 'LocalStorage.test.js'
    },
    {
      code: 'database.query("SELECT * FROM users")',
      filename: 'Database.test.js'
    },

    // File URLs are allowed
    {
      code: 'fetch("file:///path/to/local/file.json")',
      filename: 'FileURL.test.js'
    },
    {
      code: 'axios.get("file:///home/user/data.json")',
      filename: 'AxiosFileURL.test.js'
    },

    // Test allowInIntegration option
    {
      code: 'fetch("https://api.example.com")',
      filename: 'integration.test.js',
      options: [{ allowInIntegration: true }]
    },
    {
      code: 'axios.get("/api/data")',
      filename: 'e2e.test.js',
      options: [{ allowInIntegration: true }]
    },
    {
      code: 'fetch("https://external.com")',
      filename: 'end-to-end.spec.js',
      options: [{ allowInIntegration: true }]
    },

    // Test allowLocalhost option (true by default)
    {
      code: 'fetch("http://localhost:3000/api")',
      filename: 'LocalhostDefault.test.js'
    },
    {
      code: 'fetch("http://127.0.0.1:8080/api")',
      filename: 'LocalIPDefault.test.js'
    },
    {
      code: 'fetch("http://localhost:3000/api")',
      filename: 'LocalhostExplicit.test.js',
      options: [{ allowLocalhost: true }]
    },

    // Test mockModules option
    {
      code: 'fetch("https://api.example.com")',
      filename: 'FetchNotInMockModules.test.js',
      options: [{ mockModules: ['axios'] }] // fetch not in list
    },
    {
      code: 'axios.get("/api")',
      filename: 'AxiosNotInMockModules.test.js',
      options: [{ mockModules: ['fetch'] }] // axios not in list
    },
    {
      code: 'http.get("http://example.com")',
      filename: 'HttpNotInMockModules.test.js',
      options: [{ mockModules: ['axios', 'fetch'] }] // http not in list
    },

    // Test allowedDomains with existing option
    {
      code: 'fetch("https://api.test.com/data")',
      filename: 'AllowedDomain.test.js',
      options: [{ allowedDomains: ['api.test.com'] }]
    },
    {
      code: 'axios.get("https://safe.example.org/api")',
      filename: 'AllowedAxios.test.js',
      options: [{ allowedDomains: ['safe.example.org'] }]
    },

    // Test combinations of options
    {
      code: 'fetch("http://localhost:3000/api")',
      filename: 'LocalhostWithOther.test.js',
      options: [{ allowLocalhost: true, mockModules: ['axios'] }]
    },
    {
      code: 'axios.get("https://api.test.com/data")',
      filename: 'IntegrationWithDomain.integration.test.js',
      options: [{ allowInIntegration: true, allowedDomains: ['api.test.com'] }]
    },

    // Test empty mockModules (should not flag anything)
    {
      code: 'fetch("https://api.example.com")',
      filename: 'NoMockModules.test.js',
      options: [{ mockModules: [] }]
    },
    {
      code: 'axios.get("/api")',
      filename: 'AxiosNoMockModules.test.js',
      options: [{ mockModules: [] }]
    },
    {
      code: 'http.request(options)',
      filename: 'HttpNoMockModules.test.js',
      options: [{ mockModules: [] }]
    }
  ],

  invalid: [
    // Unmocked fetch
    {
      code: 'fetch("https://api.example.com/users")',
      filename: 'Fetch.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'await fetch("/api/data")',
      filename: 'AwaitFetch.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'window.fetch("https://api.example.com")',
      filename: 'WindowFetch.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'global.fetch(url)',
      filename: 'GlobalFetch.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },

    // Unmocked axios
    {
      code: 'axios.get("/api/users")',
      filename: 'AxiosGet.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: 'axios.post("/api/users", data)',
      filename: 'AxiosPost.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: 'axios.put("/api/users/1", data)',
      filename: 'AxiosPut.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: 'axios.delete("/api/users/1")',
      filename: 'AxiosDelete.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: 'axios.patch("/api/users/1", data)',
      filename: 'AxiosPatch.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: 'axios({ method: "get", url: "/api" })',
      filename: 'AxiosConfig.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },

    // XMLHttpRequest
    {
      code: 'new XMLHttpRequest()',
      filename: 'XMLHttpRequest.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'XMLHttpRequest' }
      }]
    },
    {
      code: 'const xhr = new XMLHttpRequest(); xhr.open("GET", url)',
      filename: 'XHROpen.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'XMLHttpRequest' }
      }]
    },

    // jQuery AJAX
    {
      code: '$.ajax({ url: "/api/data" })',
      filename: 'JQueryAjax.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'ajax' }
      }]
    },
    {
      code: '$.get("/api/users")',
      filename: 'JQueryGet.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'ajax' }
      }]
    },
    {
      code: '$.post("/api/users", data)',
      filename: 'JQueryPost.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'ajax' }
      }]
    },
    {
      code: 'jQuery.ajax({ url: "/api" })',
      filename: 'JQueryFull.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'ajax' }
      }]
    },

    // Node.js http/https
    {
      code: 'http.get("http://example.com", callback)',
      filename: 'HttpGet.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'http' }
      }]
    },
    {
      code: 'https.get("https://example.com", callback)',
      filename: 'HttpsGet.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'https' }
      }]
    },
    {
      code: 'http.request(options, callback)',
      filename: 'HttpRequest.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'http' }
      }]
    },
    {
      code: 'https.request(options, callback)',
      filename: 'HttpsRequest.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'https' }
      }]
    },

    // superagent
    {
      code: 'superagent.get("/api/users")',
      filename: 'Superagent.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'superagent' }
      }]
    },
    {
      code: 'request.post("/api/users").send(data)',
      filename: 'SuperagentPost.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'request' }
      }]
    },

    // node-fetch
    {
      code: 'import fetch from "node-fetch"; fetch(url)',
      filename: 'NodeFetch.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },

    // got
    {
      code: 'got("https://api.example.com")',
      filename: 'Got.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'got' }
      }]
    },
    {
      code: 'got.post(url, { json: data })',
      filename: 'GotPost.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'got' }
      }]
    },

    // WebSocket
    {
      code: 'new WebSocket("ws://localhost:8080")',
      filename: 'WebSocket.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'WebSocket' }
      }]
    },
    {
      code: 'const ws = new WebSocket(url)',
      filename: 'WebSocketVar.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'WebSocket' }
      }]
    },

    // Multiple violations - fetch
    {
      code: 'fetch("/api/users");',
      filename: 'MultipleFetch.test.js',
      errors: [
        { messageId: 'mockNetwork', data: { method: 'fetch' } }
      ]
    },
    // Multiple violations - axios
    {
      code: 'axios.post("/api/data", data);',
      filename: 'MultipleAxios.test.js',
      errors: [
        { messageId: 'mockNetwork', data: { method: 'axios' } }
      ]
    },
    // Multiple violations - jQuery
    {
      code: '$.get("/api/info");',
      filename: 'MultipleJquery.test.js',
      errors: [
        { messageId: 'mockNetwork', data: { method: 'ajax' } }
      ]
    },

    // In test blocks
    {
      code: 'it("fetches data", async () => { await fetch("/api/data"); })',
      filename: 'TestBlock.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'test("posts data", () => { return axios.post("/api", data); })',
      filename: 'TestCase.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },

    // Different test file extensions
    {
      code: 'fetch("https://api.example.com")',
      filename: 'Fetch.spec.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'axios.get("/api")',
      filename: 'test/axios.test.ts',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: '$.ajax({ url: "/api" })',
      filename: '__tests__/jquery.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'ajax' }
      }]
    },

    // Promise chains
    {
      code: 'fetch(url).then(res => res.json())',
      filename: 'FetchChain.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'axios.get(url).catch(handleError)',
      filename: 'AxiosChain.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },

    // External APIs
    {
      code: 'fetch("https://jsonplaceholder.typicode.com/users")',
      filename: 'ExternalAPI.test.js',
      errors: [{
        messageId: 'avoidExternalAPI'
      }]
    },
    {
      code: 'axios.get("https://api.github.com/users")',
      filename: 'GitHubAPI.test.js',
      errors: [{
        messageId: 'avoidExternalAPI'
      }]
    },

    // Test allowInIntegration option (false by default)
    {
      code: 'fetch("https://api.example.com")',
      filename: 'integration.test.js',
      options: [{ allowInIntegration: false }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'axios.get("/api")',
      filename: 'regular.test.js',
      options: [{ allowInIntegration: true }], // not an integration test
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },

    // Test allowLocalhost option
    {
      code: 'fetch("http://localhost:3000/api")',
      filename: 'LocalhostDisabled.test.js',
      options: [{ allowLocalhost: false }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'fetch("http://127.0.0.1:8080/api")',
      filename: 'LocalIPDisabled.test.js',
      options: [{ allowLocalhost: false }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'axios.get("http://localhost:5000/users")',
      filename: 'AxiosLocalhost.test.js',
      options: [{ allowLocalhost: false }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },

    // Test mockModules option
    {
      code: 'fetch("https://api.example.com")',
      filename: 'FetchInMockModules.test.js',
      options: [{ mockModules: ['fetch', 'axios'] }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'axios.get("/api")',
      filename: 'AxiosInMockModules.test.js',
      options: [{ mockModules: ['axios', 'fetch'] }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: 'http.request(options)',
      filename: 'HttpInMockModules.test.js',
      options: [{ mockModules: ['http', 'https'] }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'http' }
      }]
    },
    {
      code: 'https.get("https://example.com")',
      filename: 'HttpsInMockModules.test.js',
      options: [{ mockModules: ['https'] }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'https' }
      }]
    },

    // Test combinations of options
    {
      code: 'fetch("http://localhost:3000")',
      filename: 'ComboLocalhost.test.js',
      options: [{ allowLocalhost: false, mockModules: ['fetch'] }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'fetch' }
      }]
    },
    {
      code: 'axios.get("https://api.external.com")',
      filename: 'ComboDomains.test.js',
      options: [{ allowedDomains: ['api.safe.com'], mockModules: ['axios'] }],
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'axios' }
      }]
    },
    {
      code: 'fetch("https://jsonplaceholder.typicode.com/todos")',
      filename: 'integration.test.js',
      options: [{ allowInIntegration: false, allowLocalhost: true }],
      errors: [{
        messageId: 'avoidExternalAPI'
      }]
    },

    // Test default mockModules
    {
      code: 'request.post("/api/data")',
      filename: 'RequestDefault.test.js',
      errors: [{
        messageId: 'mockNetwork',
        data: { method: 'request' }
      }]
    },

  ]
});