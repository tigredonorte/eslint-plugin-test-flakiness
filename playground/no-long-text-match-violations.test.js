/**
 * Examples of no-long-text-match rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Long Text Match Violations', () => {
  // ❌ BAD: Matching entire paragraphs
  it('should not match long text strings', () => {
    const longText = screen.getByText(
      'This is a very long paragraph that contains multiple sentences. It describes various things in detail and goes on for quite a while. Matching this entire text is brittle and prone to breaking when any small change is made.'
    );

    expect(longText).toBeInTheDocument();
  });

  // ❌ BAD: Matching long error messages
  it('should not match complete error messages', () => {
    expect(errorMessage).toBe(
      'Error: Failed to connect to the database server at localhost:5432. Please check your connection settings and ensure the database server is running. Error code: ECONNREFUSED'
    );
  });

  // ❌ BAD: Matching long UI text
  it('should not match long UI content', () => {
    expect(screen.getByText(
      'Welcome to our application! This comprehensive platform provides you with all the tools you need to manage your projects effectively. Get started by creating your first project.'
    )).toBeVisible();
  });

  // ❌ BAD: Matching multi-line text
  it('should not match multi-line strings', () => {
    const description = `
      This is a multi-line description
      that spans several lines and contains
      detailed information about the product
      including features, benefits, and usage instructions.
    `;

    expect(element.textContent).toBe(description);
  });

  // ❌ BAD: Matching HTML content
  it('should not match long HTML strings', () => {
    expect(container.innerHTML).toBe(
      '<div class="container"><h1>Title</h1><p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></div>'
    );
  });

  // ❌ BAD: Matching JSON strings
  it('should not match stringified JSON', () => {
    const expectedJson = '{"user":{"id":123,"name":"John Doe","email":"john@example.com","address":{"street":"123 Main St","city":"New York","country":"USA"},"preferences":{"theme":"dark","language":"en"}}}';

    expect(JSON.stringify(response)).toBe(expectedJson);
  });

  // ❌ BAD: Matching concatenated strings
  it('should not match long concatenated strings', () => {
    const message = 'User ' + username + ' has successfully logged in at ' + timestamp + ' from IP address ' + ipAddress + ' using browser ' + userAgent;

    expect(logEntry).toBe(message);
  });

  // ❌ BAD: Matching template literals with long content
  it('should not match long template literals', () => {
    const emailBody = `
      Dear ${customerName},

      Thank you for your recent purchase of ${productName}. Your order #${orderId} has been processed and will be shipped within 2-3 business days.

      You can track your order at: ${trackingUrl}

      If you have any questions, please don't hesitate to contact our customer support team.

      Best regards,
      The Sales Team
    `;

    expect(sentEmail.body).toBe(emailBody);
  });

  // ❌ BAD: Matching SQL queries
  it('should not match complete SQL queries', () => {
    const query = 'SELECT users.id, users.name, users.email, orders.total, orders.created_at FROM users INNER JOIN orders ON users.id = orders.user_id WHERE orders.status = "completed" AND orders.created_at > "2023-01-01" ORDER BY orders.created_at DESC LIMIT 100';

    expect(executedQuery).toBe(query);
  });

  // ❌ BAD: Matching log messages
  it('should not match detailed log messages', () => {
    expect(logOutput).toContain(
      '[2023-10-15 14:23:45.678] [INFO] [UserService] User authentication successful for user ID: 12345, session created with token: abc123def456, expiry: 2023-10-15T16:23:45.678Z'
    );
  });

  // ❌ BAD: Matching validation messages
  it('should not match long validation messages', () => {
    expect(validationError).toBe(
      'The password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character from the following: !@#$%^&*()'
    );
  });

  // ❌ BAD: Matching tooltips and help text
  it('should not match long tooltip text', () => {
    const tooltip = screen.getByTitle(
      'This field is required. Please enter a valid email address in the format: example@domain.com. The email will be used for account verification and password recovery purposes.'
    );

    expect(tooltip).toBeInTheDocument();
  });
});