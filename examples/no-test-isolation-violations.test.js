/**
 * Examples of no-test-isolation rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Test Isolation Violations', () => {
  // ❌ BAD: Using .only() focuses on single test
  it.only('should run only this test', () => {
    expect(true).toBe(true);
  });

  // ❌ BAD: Using .skip() skips test
  it.skip('should skip this test', () => {
    expect(true).toBe(true);
  });

  // ❌ BAD: Using test.only()
  test.only('another focused test', () => {
    expect(1 + 1).toBe(2);
  });

  // ❌ BAD: Using describe.only()
  describe.only('focused suite', () => {
    it('test inside focused suite', () => {
      expect(true).toBe(true);
    });
  });

  // ❌ BAD: Using describe.skip()
  describe.skip('skipped suite', () => {
    it('test inside skipped suite', () => {
      expect(true).toBe(true);
    });
  });

  // ❌ BAD: Using xit() to skip
  xit('skipped test using xit', () => {
    expect(true).toBe(true);
  });

  // ❌ BAD: Using xdescribe() to skip
  xdescribe('skipped suite using xdescribe', () => {
    it('test inside xdescribe', () => {
      expect(true).toBe(true);
    });
  });

  // ❌ BAD: Using fit() to focus
  fit('focused test using fit', () => {
    expect(true).toBe(true);
  });

  // ❌ BAD: Using fdescribe() to focus
  fdescribe('focused suite using fdescribe', () => {
    it('test inside fdescribe', () => {
      expect(true).toBe(true);
    });
  });
});