/**
 * Examples of no-test-isolation rule violations
 * Demonstrates shared state, global mutation, and missing cleanup.
 */

describe('Test Isolation Violations', () => {
  // ❌ BAD: Shared mutable variable between tests
  let sharedCounter = 0;

  it('increments sharedCounter', () => {
    sharedCounter++;
    expect(sharedCounter).toBe(1);
  });

  it('expects sharedCounter to be 1 (depends on previous test)', () => {
    expect(sharedCounter).toBe(1); // Fails if run in isolation
  });

  // ❌ BAD: Mutating global object without cleanup
  it('sets global.foo', () => {
    global.foo = 'bar';
    expect(global.foo).toBe('bar');
  });

  it('expects global.foo to be undefined', () => {
    expect(global.foo).toBeUndefined(); // Fails if previous test ran
  });

  // ❌ BAD: Not cleaning up environment variable
  it('sets process.env.TEST_VAR', () => {
    process.env.TEST_VAR = 'value';
    expect(process.env.TEST_VAR).toBe('value');
  });

  it('expects process.env.TEST_VAR to be undefined', () => {
    expect(process.env.TEST_VAR).toBeUndefined(); // Fails if previous test ran
  });

  // ❌ BAD: Shared mock state
  const mockFn = jest.fn();

  it('calls mock function', () => {
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('expects mock not to have been called', () => {
    expect(mockFn).not.toHaveBeenCalled(); // Fails due to previous test
  });

  // ❌ BAD: DOM state that persists
  it('modifies DOM', () => {
    document.body.innerHTML = '<div id="test">Test</div>';
    expect(document.getElementById('test')).toBeTruthy();
  });

  it('expects clean DOM', () => {
    expect(document.getElementById('test')).toBeNull(); // Fails due to previous test
  });
});