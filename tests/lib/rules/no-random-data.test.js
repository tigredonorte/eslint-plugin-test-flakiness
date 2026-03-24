/**
 * @fileoverview Tests for no-random-data rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-random-data');
const { RuleTester } = require('eslint');
const semver = require('semver');

// Detect ESLint version for proper RuleTester configuration
const eslintPackage = require('eslint/package.json');
const eslintVersion = semver.major(eslintPackage.version);

// Configure RuleTester based on ESLint version
const ruleTesterConfig = eslintVersion >= 9
  ? {
      // ESLint 9+ (flat config)
      languageOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    }
  : {
      // ESLint 8 and below
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    };

const ruleTester = new RuleTester(ruleTesterConfig);

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

    // Math.random() in setup hooks with allowInSetup enabled
    {
      code: `
        beforeEach(() => {
          Math.random();
        });
      `,
      filename: 'Setup.test.js',
      options: [{ allowInSetup: true }]
    },

    // Date.now() in setup hooks with allowInSetup enabled
    {
      code: `
        beforeAll(() => {
          const timestamp = Date.now();
        });
      `,
      filename: 'Setup.test.js',
      options: [{ allowInSetup: true }]
    },

    // chance library with seed called and allowSeededRandom
    {
      code: `
        test('uses seeded chance', () => {
          chance.seed(123);
          const value = chance.integer();
        });
      `,
      filename: 'Chance.test.js',
      options: [{ allowSeededRandom: true }]
    },

    // casual library with seed called and allowSeededRandom
    {
      code: `
        test('uses seeded casual', () => {
          casual.seed(456);
          const value = casual.integer();
        });
      `,
      filename: 'Casual.test.js',
      options: [{ allowSeededRandom: true }]
    },

    // casual library with setSeed called and allowSeededRandom
    {
      code: `
        test('uses seeded casual with setSeed', () => {
          casual.setSeed(789);
          const value = casual.name;
        });
      `,
      filename: 'Casual.test.js',
      options: [{ allowSeededRandom: true }]
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
    },

    // Test allowInSetup option
    {
      code: 'beforeEach(() => { Math.random(); })',
      filename: 'Setup.test.js',
      options: [{ allowInSetup: true }]
    },
    {
      code: 'beforeAll(() => { Date.now(); })',
      filename: 'SetupDate.test.js',
      options: [{ allowInSetup: true }]
    },
    {
      code: 'before(() => { crypto.randomBytes(16); })',
      filename: 'SetupCrypto.test.js',
      options: [{ allowInSetup: true }]
    },
    {
      code: 'beforeEach(() => { faker.seed(123); faker.name.firstName(); })',
      filename: 'SetupFaker.test.js',
      options: [{ allowInSetup: true, allowSeededRandom: true }]
    },

    // Test allowSeededRandom option with correct name
    {
      code: 'faker.seed(123); faker.name.firstName()',
      filename: 'SeededFaker.test.js',
      options: [{ allowSeededRandom: true }]
    },
    {
      code: 'chance.seed(100); chance.name()',
      filename: 'SeededChance.test.js',
      options: [{ allowSeededRandom: true }]
    },

    // Test allowedMethods option
    {
      code: 'generateTestId()',
      filename: 'AllowedMethod.test.js',
      options: [{ allowedMethods: ['generateTestId'] }]
    },
    {
      code: 'crypto.randomBytes(16)',
      filename: 'AllowedCrypto.test.js',
      options: [{ allowedMethods: ['randomBytes'] }]
    },
    {
      code: '_.sample(array)',
      filename: 'AllowedLodash.test.js',
      options: [{ allowedMethods: ['sample'] }]
    },
    {
      code: 'uuid.v4()',
      filename: 'AllowedUuidV4.test.js',
      options: [{ allowedMethods: ['v4'] }]
    },

    // Math.random() used for seeding
    {
      code: 'randomSeed.seed(Math.random())',
      filename: 'Seeding.test.js'
    },

    // Date.now() in setup hook with allowInSetup
    {
      code: `
        beforeEach(() => {
          startTime = Date.now();
        });
      `,
      filename: 'SetupHook.test.js',
      options: [{ allowInSetup: true }]
    },

    // Math.random() in setup hook with allowInSetup
    {
      code: `
        beforeAll(() => {
          seed = Math.random();
        });
      `,
      filename: 'SetupRandom.test.js',
      options: [{ allowInSetup: true }]
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

    // UUID v4 usage
    {
      code: 'uuid.v4()',
      filename: 'UuidV4.test.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
    },

    // UUID v1 usage
    {
      code: 'uuid.v1()',
      filename: 'UuidV1.test.js',
      errors: [{
        messageId: 'avoidUUID'
      }]
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

    // Test that allowSeededRandom = false disables seeded random
    {
      code: 'faker.seed(123); faker.name.firstName()',
      filename: 'DisallowSeeded.test.js',
      options: [{ allowSeededRandom: false }],
      errors: [{
        messageId: 'useSeed',
        data: { library: 'faker' }
      }]
    },

    // Test that allowInSetup doesn't apply outside setup hooks
    {
      code: 'it("test", () => { Math.random(); })',
      filename: 'NotInSetup.test.js',
      options: [{ allowInSetup: true }],
      errors: [{
        messageId: 'avoidRandom'
      }]
    },

    // Test that allowedMethods doesn't apply to other methods
    {
      code: 'crypto.randomUUID()',
      filename: 'NotAllowed.test.js',
      options: [{ allowedMethods: ['randomBytes'] }],
      errors: [{
        messageId: 'avoidCryptoRandom'
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
      filename: 'src/__tests__/uuid.js',
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