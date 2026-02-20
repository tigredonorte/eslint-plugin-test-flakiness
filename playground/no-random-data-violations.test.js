/**
 * Examples of no-random-data rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

describe('Random Data Violations', () => {
  // ❌ BAD: Using Math.random()
  it('should not use Math.random', () => {
    const items = ['a', 'b', 'c', 'd'];
    const randomValue = Math.random();
    const randomInt = Math.floor(Math.random() * 100);
    const randomChoice = items[Math.floor(Math.random() * items.length)];

    expect(randomValue).toBeGreaterThanOrEqual(0);
    expect(randomValue).toBeLessThan(1);
    expect(randomInt).toBeGreaterThanOrEqual(0);
    expect(randomChoice).toBeDefined();
  });

  // ❌ BAD: Using Date.now() for randomness
  it('should not use Date.now for randomness', () => {
    const uniqueId = 'user_' + Date.now();
    const timestamp = Date.now();
    const randomSeed = Date.now() % 1000;

    expect(uniqueId).toContain('user_');
    expect(timestamp).toBeGreaterThan(0);
    expect(randomSeed).toBeGreaterThanOrEqual(0);
  });

  // ❌ BAD: Using new Date() without fixed time
  it('should not use dynamic dates', () => {
    const now = new Date();
    const currentYear = new Date().getFullYear();
    const timestamp = new Date().getTime();

    expect(now).toBeInstanceOf(Date);
    expect(currentYear).toBeGreaterThan(2000);
    expect(timestamp).toBeGreaterThan(0);
  });

  // ❌ BAD: Using crypto.randomBytes
  it('should not use crypto random', () => {
    const crypto = {
      randomBytes: (size) => ({
        toString: () => '0'.repeat(size * 2)
      }),
      randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
    };

    const randomBytes = crypto.randomBytes(16);
    const randomToken = crypto.randomBytes(32).toString('hex');
    const randomUUID = crypto.randomUUID();

    expect(randomBytes).toBeDefined();
    expect(randomToken).toHaveLength(64);
    expect(randomUUID).toBeDefined();
  });

  // ❌ BAD: Using faker/casual for test data
  it('should not use faker for random data', () => {
    const faker = {
      name: { findName: () => 'John Doe' },
      internet: { email: () => 'john@example.com' },
      address: { streetAddress: () => '123 Main St' },
      phone: { phoneNumber: () => '555-1234' }
    };

    const name = faker.name.findName();
    const email = faker.internet.email();
    const address = faker.address.streetAddress();
    const phone = faker.phone.phoneNumber();

    expect(name).toBeDefined();
    expect(email).toContain('@');
    expect(address).toBeDefined();
    expect(phone).toBeDefined();
  });

  // ❌ BAD: Using chance.js
  it('should not use chance for random data', () => {
    const Chance = function() {};
    const chance = new Chance();
    chance.name = () => 'Jane Doe';
    chance.age = () => 25;
    chance.bool = () => true;

    const randomName = chance.name();
    const randomAge = chance.age();
    const randomBool = chance.bool();

    expect(randomName).toBeDefined();
    expect(randomAge).toBeGreaterThan(0);
    expect(randomBool).toBeDefined();
  });

  // ❌ BAD: Using lodash random functions
  it('should not use lodash random', () => {
    const _ = {
      random: () => 50,
      shuffle: (arr) => arr,
      sample: () => 'b',
      sampleSize: () => [1, 2, 3]
    };

    const randomNum = _.random(1, 100);
    const shuffled = _.shuffle([1, 2, 3, 4, 5]);
    const sampled = _.sample(['a', 'b', 'c']);
    const sampleSize = _.sampleSize([1, 2, 3, 4, 5], 3);

    expect(randomNum).toBeGreaterThanOrEqual(1);
    expect(shuffled).toBeDefined();
    expect(sampled).toBeDefined();
    expect(sampleSize).toBeDefined();
  });

  // ❌ BAD: UUID generation
  it('should not generate UUIDs dynamically', () => {
    const uuid = {
      v4: () => '123e4567-e89b-42d3-a456-426614174000'
    };
    const uuidv4 = () => '123e4567-e89b-42d3-a456-426614174001';
    const generateUUID = () => '123e4567-e89b-42d3-a456-426614174002';

    const id = uuid.v4();
    const sessionId = uuidv4();
    const requestId = generateUUID();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(sessionId).toBeDefined();
    expect(requestId).toBeDefined();
  });

  // ❌ BAD: Performance.now() for uniqueness
  it('should not use performance.now', () => {
    const performance = {
      now: () => 1234567.89
    };

    const startTime = performance.now();
    const uniqueKey = 'key_' + performance.now();

    expect(startTime).toBeGreaterThan(0);
    expect(uniqueKey).toContain('key_');
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
      const result = [];
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() * characters.length)));
      }
      return result.join('');
    }

    const customRandom = generateRandomString(10);
    expect(randomString).toBeDefined();
    expect(randomHex).toBeDefined();
    expect(customRandom).toHaveLength(10);
  });

  // ❌ BAD: Random delays
  it('should not use random delays', () => {
    const randomDelay = Math.floor(Math.random() * 1000) + 500;

    // Note: This test demonstrates the anti-pattern of using
    // random values for delays, but doesn't actually wait
    // to avoid the no-unconditional-wait violation

    expect(randomDelay).toBeGreaterThan(0);
    expect(randomDelay).toBeLessThanOrEqual(1500);
  });
});