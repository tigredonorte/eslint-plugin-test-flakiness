/**
 * Examples of no-promise-race rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Promise.race Violations', () => {
  // ❌ BAD: Using Promise.race in tests
  it('should not use Promise.race', async () => {
    const result = await Promise.race([
      fetch('/api/data'),
      waitFor(() => expect(true).toBe(true), { timeout: 5000 })
    ]);

    expect(result).toBeDefined();
  });

  // ❌ BAD: Race between multiple API calls
  it('should not race API calls', async () => {
    const fastest = await Promise.race([
      fetch('/api/endpoint1'),
      fetch('/api/endpoint2'),
      fetch('/api/endpoint3')
    ]);

    expect(fastest.status).toBe(200);
  });

  // ❌ BAD: Racing with timeout promise
  it('should not race with timeout', async () => {
    const timeoutPromise = waitFor(() => expect(true).toBe(true), { timeout: 3000 });

    const dataPromise = fetchData();

    const result = await Promise.race([dataPromise, timeoutPromise]);
    expect(result).toHaveProperty('data');
  });

  // ❌ BAD: Using race for test timeout
  it('should not implement custom timeout with race', async () => {
    const testOperation = async () => {
      // Some async operation
      return await doSomething();
    };

    const timeout = waitFor(() => expect(true).toBe(true), { timeout: 10000 });

    const result = await Promise.race([testOperation(), timeout]);
    expect(result).toBeTruthy();
  });

  // ❌ BAD: Racing element appearance checks
  it('should not race element checks', async () => {
    const elementFound = Promise.race([
      waitForElement('.element1'),
      waitForElement('.element2'),
      waitForElement('.element3')
    ]);

    const element = await elementFound;
    expect(element).toBeVisible();
  });

  // ❌ BAD: Competitive loading pattern
  it('should not use competitive loading', async () => {
    const winner = await Promise.race([
      loadFromCache(),
      loadFromNetwork(),
      loadFromLocalStorage()
    ]);

    expect(winner).toBeDefined();
  });

  // ❌ BAD: Race with Promise.resolve
  it('should not race with immediate values', async () => {
    const result = await Promise.race([
      Promise.resolve('immediate'),
      fetch('/api/slow-endpoint')
    ]);

    expect(result).toBe('immediate'); // This will always win
  });
});