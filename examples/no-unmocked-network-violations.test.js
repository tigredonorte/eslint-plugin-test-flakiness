/**
 * Examples of no-unmocked-network rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Unmocked Network Violations', () => {
  // ❌ BAD: Direct fetch without mocking
  it('should not use unmocked fetch', async () => {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    expect(data).toHaveProperty('users');
  });

  // ❌ BAD: XMLHttpRequest without mocking
  it('should not use unmocked XMLHttpRequest', (done) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.example.com/users');
    xhr.onload = () => {
      expect(xhr.status).toBe(200);
      done();
    };
    xhr.send();
  });

  // ❌ BAD: Axios without mocking
  it('should not use unmocked axios', async () => {
    const response = await axios.get('https://api.example.com/products');
    expect(response.data).toBeDefined();
  });

  // ❌ BAD: jQuery AJAX without mocking
  it('should not use unmocked jQuery.ajax', (done) => {
    $.ajax({
      url: 'https://api.example.com/data',
      success: (data) => {
        expect(data).toBeDefined();
        done();
      }
    });
  });

  // ❌ BAD: Node.js http/https modules
  it('should not use unmocked http module', (done) => {
    const http = require('http');
    http.get('http://api.example.com/data', (res) => {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  // ❌ BAD: WebSocket without mocking
  it('should not use unmocked WebSocket', () => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      ws.send('test message');
    };
    ws.onmessage = (event) => {
      expect(event.data).toBeDefined();
    };
  });

  // ❌ BAD: EventSource (Server-Sent Events) without mocking
  it('should not use unmocked EventSource', () => {
    const eventSource = new EventSource('https://api.example.com/events');
    eventSource.onmessage = (event) => {
      expect(event.data).toBeDefined();
    };
  });

  // ❌ BAD: GraphQL request without mocking
  it('should not make unmocked GraphQL requests', async () => {
    const query = `
      query GetUser {
        user(id: "123") {
          name
          email
        }
      }
    `;

    const response = await fetch('https://api.example.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    expect(data.data.user).toBeDefined();
  });

  // ❌ BAD: Multiple unmocked network calls
  it('should not chain unmocked requests', async () => {
    const userResponse = await fetch('https://api.example.com/user');
    const user = await userResponse.json();

    const postsResponse = await fetch(`https://api.example.com/posts?userId=${user.id}`);
    const posts = await postsResponse.json();

    expect(posts.length).toBeGreaterThan(0);
  });

  // ❌ BAD: Supertest/Superagent to external URLs
  it('should not use supertest for external APIs', async () => {
    await request('https://external-api.com')
      .get('/endpoint')
      .expect(200)
      .expect('Content-Type', /json/);
  });
});