/**
 * @fileoverview Tests for no-unmocked-network rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-unmocked-network');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

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
      code: 'import MockAdapter from "axios-mock-adapter"; const mock = new MockAdapter(axios);',
      filename: 'AxiosMockAdapter.test.js'
    },

    // Using MSW (Mock Service Worker)
    {
      code: 'import { setupServer } from "msw/node"; const server = setupServer();',
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

    // Multiple violations
    {
      code: `
        fetch("/api/users");
        axios.post("/api/data", data);
        $.get("/api/info");
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'mockNetwork', data: { method: 'fetch' } },
        { messageId: 'mockNetwork', data: { method: 'axios' } },
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
    }
  ]
});