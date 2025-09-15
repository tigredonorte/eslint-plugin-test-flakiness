/**
 * @fileoverview Tests for no-random-data rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-random-data');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-random-data', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'Math.random()',
      filename: 'src/app.js'
    },
    {
      code: 'crypto.randomBytes(16)',
      filename: 'src/crypto.js'
    },

    // Using fixed seed values
    {
      code: 'faker.seed(123)',
      filename: 'Faker.test.js'
    },
    {
      code: 'random.seed(42)',
      filename: 'Random.test.js'
    },
    {
      code: 'chance.seed = 100',
      filename: 'Chance.test.js'
    },

    // Using mocked random
    {
      code: 'jest.spyOn(Math, "random").mockReturnValue(0.5)',
      filename: 'Mock.test.js'
    },
    {
      code: 'vi.spyOn(Math, "random").mockReturnValue(0.5)',
      filename: 'ViMock.test.js'
    },
    {
      code: 'sinon.stub(Math, "random").returns(0.5)',
      filename: 'Sinon.test.js'
    },

    // Fixed test data
    {
      code: 'const testId = "test-123"',
      filename: 'FixedId.test.js'
    },
    {
      code: 'const timestamp = 1234567890',
      filename: 'FixedTime.test.js'
    },
    {
      code: 'const uuid = "550e8400-e29b-41d4-a716-446655440000"',
      filename: 'FixedUuid.test.js'
    },

    // Deterministic functions
    {
      code: 'const hash = crypto.createHash("sha256").update(data).digest()',
      filename: 'Hash.test.js'
    },
    {
      code: 'const id = btoa("test")',
      filename: 'Base64.test.js'
    },

    // Using test data builders
    {
      code: 'const user = buildUser({ id: 1 })',
      filename: 'Builder.test.js'
    },
    {
      code: 'const data = createTestData()',
      filename: 'TestData.test.js'
    },

    // Non-random methods that might look random
    {
      code: 'array.sort()',
      filename: 'Sort.test.js'
    },
    {
      code: 'items.shuffle()',
      filename: 'Shuffle.test.js'
    }
  ],

  invalid: [
    // Math.random usage
    {
      code: 'Math.random()',
      filename: 'Random.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: 'const value = Math.random()',
      filename: 'RandomValue.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: 'const id = Math.floor(Math.random() * 1000)',
      filename: 'RandomId.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },

    // crypto random methods
    {
      code: 'crypto.randomBytes(16)',
      filename: 'CryptoBytes.test.js',
      errors: [{
        messageId: 'avoidCryptoRandom'
      }]
    },
    {
      code: 'crypto.randomUUID()',
      filename: 'RandomUUID.test.js',
      errors: [{
        messageId: 'avoidCryptoRandom'
      }]
    },
    {
      code: 'crypto.randomInt(0, 100)',
      filename: 'RandomInt.test.js',
      errors: [{
        messageId: 'avoidCryptoRandom'
      }]
    },
    {
      code: 'crypto.getRandomValues(array)',
      filename: 'RandomValues.test.js',
      errors: [{
        messageId: 'avoidCryptoRandom'
      }]
    },

    // UUID generation
    {
      code: 'uuid()',
      filename: 'UUID.test.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
    },
    {
      code: 'uuidv4()',
      filename: 'UUIDv4.test.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
    },
    {
      code: 'generateUUID()',
      filename: 'GenerateUUID.test.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
    },
    {
      code: 'nanoid()',
      filename: 'Nanoid.test.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
    },

    // Date.now() usage
    {
      code: 'Date.now()',
      filename: 'DateNow.test.js',
      errors: [{
        messageId: 'avoidDateNow'
      }]
    },
    {
      code: 'const timestamp = Date.now()',
      filename: 'Timestamp.test.js',
      errors: [{
        messageId: 'avoidDateNow'
      }]
    },
    {
      code: 'new Date().getTime()',
      filename: 'GetTime.test.js',
      errors: [{
        messageId: 'avoidDateNow'
      }]
    },
    {
      code: 'performance.now()',
      filename: 'Performance.test.js',
      errors: [{
        messageId: 'avoidDateNow'
      }]
    },

    // Faker without seed
    {
      code: 'faker.name.firstName()',
      filename: 'FakerName.test.js',
      errors: [{
        messageId: 'useSeed',
        data: { library: 'faker' }
      }]
    },
    {
      code: 'faker.datatype.number()',
      filename: 'FakerNumber.test.js',
      errors: [{
        messageId: 'useSeed',
        data: { library: 'faker' }
      }]
    },
    {
      code: 'faker.internet.email()',
      filename: 'FakerEmail.test.js',
      errors: [{
        messageId: 'useSeed',
        data: { library: 'faker' }
      }]
    },

    // Chance without seed
    {
      code: 'chance.name()',
      filename: 'ChanceName.test.js',
      errors: [{
        messageId: 'useSeed',
        data: { library: 'chance' }
      }]
    },
    {
      code: 'chance.integer()',
      filename: 'ChanceInteger.test.js',
      errors: [{
        messageId: 'useSeed',
        data: { library: 'chance' }
      }]
    },

    // Casual without seed
    {
      code: 'casual.name',
      filename: 'CasualName.test.js',
      errors: [{
        messageId: 'useSeed',
        data: { library: 'casual' }
      }]
    },
    {
      code: 'casual.email',
      filename: 'CasualEmail.test.js',
      errors: [{
        messageId: 'useSeed',
        data: { library: 'casual' }
      }]
    },

    // Multiple violations
    {
      code: `
        const id = Math.random();
        const timestamp = Date.now();
        const uuid = uuidv4();
        const name = faker.name.firstName();
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidRandom' },
        { messageId: 'avoidDateNow' },
        { messageId: 'avoidUUID' },
        { messageId: 'useSeed', data: { library: 'faker' } }
      ]
    },

    // In test blocks
    {
      code: 'it("should test", () => { const value = Math.random(); })',
      filename: 'TestBlock.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: 'test("random test", () => { const id = uuid(); })',
      filename: 'TestCase.test.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
    },

    // Different test file extensions
    {
      code: 'Math.random()',
      filename: 'Random.spec.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: 'Date.now()',
      filename: 'test/timestamp.test.ts',
      errors: [{
        messageId: 'avoidDateNow'
      }]
    },
    {
      code: 'uuidv4()',
      filename: '__tests__/uuid.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
    },

    // Complex expressions
    {
      code: 'const randomInRange = min + Math.random() * (max - min)',
      filename: 'Range.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: 'const randomElement = array[Math.floor(Math.random() * array.length)]',
      filename: 'ArrayRandom.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },

    // Random in conditions
    {
      code: 'if (Math.random() > 0.5) { doSomething(); }',
      filename: 'Condition.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: 'const shouldRun = Math.random() < 0.3',
      filename: 'Boolean.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },

    // Lodash random
    {
      code: '_.random(1, 100)',
      filename: 'Lodash.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: '_.sample(array)',
      filename: 'LodashSample.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    },
    {
      code: '_.shuffle(array)',
      filename: 'LodashShuffle.test.js',
      errors: [{
        messageId: 'avoidRandom'
      }]
    }
  ]
});