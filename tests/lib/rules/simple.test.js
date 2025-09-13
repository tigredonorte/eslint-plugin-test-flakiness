const { describe, it } = require('node:test');

describe('simple test', () => {
  it('works', () => {
    console.log('This is a simple test');
    expect(1 + 1).toBe(2);
  });
});