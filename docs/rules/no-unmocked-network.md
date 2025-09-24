# no-unmocked-network

Prevent real network requests in tests that can cause flakiness and external dependencies.

## Rule Details

Unmocked network requests in tests create several problems:

- Tests become dependent on external services and network connectivity
- Network latency and failures can cause intermittent test failures
- Tests may hit rate limits or quota restrictions
- External API changes can break tests unexpectedly
- Tests become slower due to network round trips
- Tests may expose sensitive data or credentials

This rule helps prevent test flakiness by detecting network operations that should be mocked or stubbed.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-unmocked-network": [
    "error",
    {
      "allowInIntegration": false,
      "allowLocalhost": true,
      "allowedDomains": [],
      "mockModules": ["axios", "fetch", "request", "http", "https"]
    }
  ]
}
```

### `allowInIntegration` (default: `false`)

When set to `true`, allows network requests in integration test files.

```javascript
// With allowInIntegration: true
// In integration.test.js
await fetch("https://api.example.com/data"); // ✅ Allowed

// With allowInIntegration: false (default)
// In any test file
await fetch("https://api.example.com/data"); // ❌ Not allowed
```

### `allowLocalhost` (default: `true`)

When set to `true`, allows requests to localhost and local development servers.

```javascript
// With allowLocalhost: true (default)
await fetch("http://localhost:3000/api"); // ✅ Allowed
await fetch("http://127.0.0.1:8080/test"); // ✅ Allowed

// With allowLocalhost: false
await fetch("http://localhost:3000/api"); // ❌ Not allowed
```

### `allowedDomains` (default: `[]`)

Array of domain names that are allowed for network requests.

```javascript
// With allowedDomains: ["api.test.com"]
await fetch("https://api.test.com/data"); // ✅ Allowed

// With allowedDomains: []
await fetch("https://api.test.com/data"); // ❌ Not allowed
```

### `mockModules` (default: `["axios", "fetch", "request", "http", "https"]`)

Array of modules that should be mocked instead of making real requests.

```javascript
// With default mockModules
const axios = require("axios"); // ❌ Should be mocked
await fetch("/api/data"); // ❌ Should be mocked

// Expected mocking
jest.mock("axios");
```

## Examples

### ❌ Incorrect

```javascript
// Direct fetch requests
const response = await fetch("https://api.example.com/users");
const data = await response.json();

// Axios requests
const axios = require("axios");
const result = await axios.get("https://api.github.com/repos/user/repo");

// HTTP/HTTPS module requests
const https = require("https");
https.get("https://api.service.com/data", (res) => {
  // Handle response
});

// Request module (deprecated but still used)
const request = require("request");
request("https://api.service.com", callback);

// Supertest without mocking
const request = require("supertest");
const response = await request("https://api.external.com")
  .get("/endpoint")
  .expect(200);

// WebSocket connections
const WebSocket = require("ws");
const ws = new WebSocket("ws://external-service.com/websocket");

// GraphQL client requests
const { GraphQLClient } = require("graphql-request");
const client = new GraphQLClient("https://api.graphql.com/v1");
await client.request(query);

// Third-party API clients
const stripe = require("stripe")("sk_test_...");
await stripe.customers.create({ email: "test@example.com" });

// Database connections to external DBs
const { Client } = require("pg");
const client = new Client({
  connectionString: "postgresql://user@external-db.com/database",
});

// Email service requests
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: { user: "test@gmail.com", pass: "password" },
});
await transporter.sendMail({ to: "user@example.com" });

// File upload services
const cloudinary = require("cloudinary").v2;
await cloudinary.uploader.upload("image.jpg");

// External service SDKs
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
await s3.getObject({ Bucket: "bucket", Key: "key" }).promise();
```

### ✅ Correct

```javascript
// Mock fetch
global.fetch = jest.fn();
fetch.mockResolvedValue({
  json: () => Promise.resolve({ users: [] }),
});

const response = await fetch("https://api.example.com/users");
const data = await response.json();

// Mock Axios
jest.mock("axios");
const axios = require("axios");
axios.get.mockResolvedValue({ data: { stars: 100 } });

const result = await axios.get("https://api.github.com/repos/user/repo");

// Mock HTTP modules
jest.mock("https");
const https = require("https");
const mockResponse = { on: jest.fn(), statusCode: 200 };
https.get.mockImplementation((url, callback) => {
  callback(mockResponse);
  return { on: jest.fn() };
});

// Mock request module
jest.mock("request");
const request = require("request");
request.mockImplementation((options, callback) => {
  callback(null, { statusCode: 200 }, '{"success": true}');
});

// Use supertest with local app
const request = require("supertest");
const app = require("../app"); // Local Express app
const response = await request(app).get("/api/users").expect(200);

// Mock WebSocket
const mockWebSocket = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
};
jest.mock("ws", () => jest.fn(() => mockWebSocket));

// Mock GraphQL client
jest.mock("graphql-request");
const { GraphQLClient } = require("graphql-request");
GraphQLClient.prototype.request = jest
  .fn()
  .mockResolvedValue({ user: { id: 1 } });

// Mock third-party services
jest.mock("stripe");
const stripe = require("stripe");
stripe.mockReturnValue({
  customers: {
    create: jest.fn().mockResolvedValue({ id: "cust_123" }),
  },
});

// Mock database with in-memory alternatives
const { Client } = require("pg");
jest.mock("pg");
Client.mockImplementation(() => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
  connect: jest.fn(),
  end: jest.fn(),
}));

// Mock email service
jest.mock("nodemailer");
const nodemailer = require("nodemailer");
const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
};
nodemailer.createTransporter.mockReturnValue(mockTransporter);

// Mock file upload services
jest.mock("cloudinary");
const cloudinary = require("cloudinary");
cloudinary.v2.uploader.upload.mockResolvedValue({
  public_id: "test-image",
  url: "https://res.cloudinary.com/test.jpg",
});

// Mock AWS SDK
jest.mock("aws-sdk");
const AWS = require("aws-sdk");
AWS.S3.mockImplementation(() => ({
  getObject: jest.fn(() => ({
    promise: () => Promise.resolve({ Body: Buffer.from("test data") }),
  })),
}));

// Localhost requests (allowed by default)
const localResponse = await fetch("http://localhost:3000/api/test");

// Test data factories instead of external calls
const createTestUser = () => ({
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
});

const testUser = createTestUser();
```

## Best Practices

### 1. Mock All External HTTP Clients

Mock popular HTTP client libraries:

```javascript
// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  mockedAxios.get.mockReset();
  mockedAxios.post.mockReset();
});

// Mock node-fetch
jest.mock('node-fetch');
const fetch = require('node-fetch');
```

### 2. Use Test Fixtures for API Responses

Create realistic mock data:

```javascript
// api-fixtures.js
export const userFixture = {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
};

export const usersListFixture = [
  userFixture,
  { id: "456", name: "Jane Smith", email: "jane@example.com" },
];

// In tests
import { userFixture, usersListFixture } from "./fixtures/api-fixtures";

beforeEach(() => {
  fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(usersListFixture),
  });
});
```

### 3. Mock Service Clients Properly

Mock third-party service SDKs:

```javascript
// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    charges: {
      create: jest.fn(),
    },
  }));
});

// Mock AWS SDK
jest.mock("aws-sdk", () => ({
  S3: jest.fn(() => ({
    putObject: jest.fn(() => ({ promise: () => Promise.resolve() })),
    getObject: jest.fn(() => ({
      promise: () => Promise.resolve({ Body: "data" }),
    })),
  })),
  config: {
    update: jest.fn(),
  },
}));
```

### 4. Use Network Interception Libraries

For more complex scenarios, use interception libraries:

```javascript
// Using nock for HTTP interception
const nock = require("nock");

beforeEach(() => {
  nock("https://api.example.com")
    .get("/users")
    .reply(200, [{ id: 1, name: "John" }]);

  nock("https://api.example.com")
    .post("/users")
    .reply(201, { id: 2, name: "Jane" });
});

afterEach(() => {
  nock.cleanAll();
});

// Using msw (Mock Service Worker)
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("https://api.example.com/users", (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: "John" }]));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 5. Handle WebSocket and Real-time Connections

Mock WebSocket and real-time connections:

```javascript
// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }

  send(data) {
    // Mock implementation
  }

  close() {
    if (this.onclose) {
      this.onclose({ code: 1000, reason: "Test close" });
    }
  }
}

global.WebSocket = MockWebSocket;

// Mock Socket.io
jest.mock("socket.io-client", () => {
  return jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  }));
});
```

### 6. Create Test Doubles for Complex Services

Build test doubles that simulate real service behavior:

```javascript
class MockEmailService {
  constructor() {
    this.sentEmails = [];
  }

  async sendEmail(to, subject, body) {
    this.sentEmails.push({ to, subject, body, sentAt: new Date() });
    return { messageId: `test-${Date.now()}` };
  }

  getSentEmails() {
    return this.sentEmails;
  }

  clearSentEmails() {
    this.sentEmails = [];
  }
}

// Use in tests
const mockEmailService = new MockEmailService();
const userService = new UserService(mockEmailService);

test("sends welcome email", async () => {
  await userService.registerUser({ email: "test@example.com" });
  const sentEmails = mockEmailService.getSentEmails();
  expect(sentEmails).toHaveLength(1);
  expect(sentEmails[0].subject).toBe("Welcome!");
});
```

## Framework-Specific Examples

### Jest

```javascript
// Global setup for mocking
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
};

// test/setup.js
global.fetch = jest.fn();
jest.mock("axios");
```

### Vitest

```javascript
// vitest.config.js
export default {
  setupFiles: ["./test/setup.ts"],
};

// test/setup.ts
import { vi } from "vitest";

global.fetch = vi.fn();
vi.mock("axios");
```

### Cypress

```javascript
// cypress/support/commands.js
Cypress.Commands.add("mockApi", () => {
  cy.intercept("GET", "https://api.example.com/**", {
    fixture: "api-data.json",
  });
});

// In test
beforeEach(() => {
  cy.mockApi();
});
```

### Playwright

```javascript
// Use route interception
test("mocks API calls", async ({ page }) => {
  await page.route("**/api/**", (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ users: [] }),
    });
  });

  await page.goto("/users");
});
```

## When Not To Use It

This rule may not be suitable if:

- You're writing integration tests that specifically test external API integration
- You're testing against local development services
- You're building network utilities or HTTP clients
- You're testing end-to-end workflows that require real network calls

In these cases:

```javascript
// Disable for integration tests
// eslint-disable-next-line test-flakiness/no-unmocked-network
const realApiResponse = await fetch('https://api.external.com/data');

// Or configure to allow specific domains
{
  "test-flakiness/no-unmocked-network": ["error", {
    "allowInIntegration": true,
    "allowedDomains": ["api.test-environment.com"]
  }]
}
```

## Related Rules

- [no-unmocked-fs](./no-unmocked-fs.md) - Prevents unmocked filesystem operations
- [no-test-isolation](./no-test-isolation.md) - Ensures test independence
- [no-random-data](./no-random-data.md) - Prevents non-deterministic test data

## Further Reading

- [Jest - Mocking Modules](https://jestjs.io/docs/mock-functions)
- [nock - HTTP Server Mocking](https://github.com/nock/nock)
- [MSW - Mock Service Worker](https://mswjs.io/)
- [Testing without Mocking](https://kentcdodds.com/blog/the-merits-of-mocking)
- [Network Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)
