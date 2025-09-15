/**
 * Examples of no-random-data rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Random Data Violations', () => {
  // ❌ BAD: Using Math.random()
  it('should not use Math.random', () => {
    const randomValue = Math.random();
    const randomInt = Math.floor(Math.random() * 100);
    const randomChoice = items[Math.floor(Math.random() * items.length)];

    expect(randomValue).toBeGreaterThanOrEqual(0);
    expect(randomValue).toBeLessThan(1);
  });

  // ❌ BAD: Using Date.now() for randomness
  it('should not use Date.now for randomness', () => {
    const uniqueId = 'user_' + Date.now();
    const timestamp = Date.now();
    const randomSeed = Date.now() % 1000;

    expect(uniqueId).toContain('user_');
  });

  // ❌ BAD: Using new Date() without fixed time
  it('should not use dynamic dates', () => {
    const now = new Date();
    const currentYear = new Date().getFullYear();
    const timestamp = new Date().getTime();

    expect(now).toBeInstanceOf(Date);
  });

  // ❌ BAD: Using crypto.randomBytes
  it('should not use crypto random', () => {
    const randomBytes = crypto.randomBytes(16);
    const randomToken = crypto.randomBytes(32).toString('hex');
    const randomUUID = crypto.randomUUID();

    expect(randomToken).toHaveLength(64);
  });

  // ❌ BAD: Using faker/casual for test data
  it('should not use faker for random data', () => {
    const name = faker.name.findName();
    const email = faker.internet.email();
    const address = faker.address.streetAddress();
    const phone = faker.phone.phoneNumber();

    expect(email).toContain('@');
  });

  // ❌ BAD: Using chance.js
  it('should not use chance for random data', () => {
    const chance = new Chance();
    const randomName = chance.name();
    const randomAge = chance.age();
    const randomBool = chance.bool();

    expect(randomAge).toBeGreaterThan(0);
  });

  // ❌ BAD: Using lodash random functions
  it('should not use lodash random', () => {
    const randomNum = _.random(1, 100);
    const shuffled = _.shuffle([1, 2, 3, 4, 5]);
    const sampled = _.sample(['a', 'b', 'c']);
    const sampleSize = _.sampleSize([1, 2, 3, 4, 5], 3);

    expect(randomNum).toBeGreaterThanOrEqual(1);
  });

  // ❌ BAD: UUID generation
  it('should not generate UUIDs dynamically', () => {
    const id = uuid.v4();
    const sessionId = uuidv4();
    const requestId = generateUUID();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  // ❌ BAD: Performance.now() for uniqueness
  it('should not use performance.now', () => {
    const startTime = performance.now();
    const uniqueKey = 'key_' + performance.now();

    expect(startTime).toBeGreaterThan(0);
  });

  // ❌ BAD: Random array operations
  it('should not randomly select from arrays', () => {
    const items = ['a', 'b', 'c', 'd'];
    const randomIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomIndex];

    // This test could fail randomly
    expect(items).toContain(randomItem);
  });

  // ❌ BAD: Random string generation
  it('should not generate random strings', () => {
    const randomString = Math.random().toString(36).substring(7);
    const randomHex = Math.random().toString(16).slice(2);

    function generateRandomString(length) {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }

    const customRandom = generateRandomString(10);
    expect(customRandom).toHaveLength(10);
  });

  // ❌ BAD: Random delays
  it('should not use random delays', async () => {
    const randomDelay = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    expect(true).toBe(true);
  });
});