# no-unmocked-fs

Prevent filesystem operations in tests that can cause side effects and flakiness.

## Rule Details

Unmocked filesystem operations in tests create several problems:

- Tests can create/modify/delete real files on the system
- File operations can fail due to permissions or disk space
- Tests may interfere with each other through shared file system state
- Different environments may have different file system behaviors
- Cleanup of created files may fail, affecting subsequent tests

This rule helps prevent test flakiness by detecting filesystem operations that should be mocked or isolated.

## Options

This rule accepts an options object with the following properties:

```json
{
  "test-flakiness/no-unmocked-fs": [
    "error",
    {
      "allowInSetup": false,
      "allowTempFiles": true,
      "allowedModules": ["fs-extra"],
      "mockModules": ["fs", "fs/promises", "node:fs"]
    }
  ]
}
```

### `allowInSetup` (default: `false`)

When set to `true`, allows filesystem operations in setup/teardown hooks.

```javascript
// With allowInSetup: true
beforeAll(() => {
  fs.mkdirSync("test-fixtures"); // ✅ Allowed
});

// With allowInSetup: false (default)
beforeAll(() => {
  fs.mkdirSync("test-fixtures"); // ❌ Not allowed
});
```

### `allowTempFiles` (default: `true`)

When set to `true`, allows operations on temporary files and directories.

```javascript
// With allowTempFiles: true (default)
const tempFile = path.join(os.tmpdir(), "test-file.txt");
fs.writeFileSync(tempFile, "test"); // ✅ Allowed

// With allowTempFiles: false
const tempFile = path.join(os.tmpdir(), "test-file.txt");
fs.writeFileSync(tempFile, "test"); // ❌ Not allowed
```

### `allowedModules` (default: `[]`)

Array of module names that are allowed to perform filesystem operations.

```javascript
// With allowedModules: ["fs-extra"]
const fsExtra = require("fs-extra");
fsExtra.readJson("package.json"); // ✅ Allowed

// With allowedModules: []
const fsExtra = require("fs-extra");
fsExtra.readJson("package.json"); // ❌ Not allowed
```

### `mockModules` (default: `["fs", "fs/promises", "node:fs"]`)

Array of module names that should be mocked instead of used directly.

```javascript
// With default mockModules
const fs = require("fs"); // ❌ Should be mocked
const fsPromises = require("fs/promises"); // ❌ Should be mocked

// Expected mocking
jest.mock("fs");
const fs = require("fs");
```

## Examples

### ❌ Incorrect

```javascript
// Direct fs operations
const fs = require("fs");
fs.writeFileSync("test-file.txt", "content");
const data = fs.readFileSync("config.json", "utf8");

// Async fs operations
const fsPromises = require("fs/promises");
await fsPromises.writeFile("output.txt", "data");
const content = await fsPromises.readFile("input.txt");

// Directory operations
fs.mkdirSync("test-directory");
fs.rmdirSync("old-directory", { recursive: true });

// File system checks
if (fs.existsSync("some-file.txt")) {
  fs.unlinkSync("some-file.txt");
}

// Stat operations
const stats = fs.statSync("file.txt");
const isDirectory = stats.isDirectory();

// Watch operations
fs.watchFile("config.js", callback);
const watcher = fs.watch("src/", callback);

// Stream operations
const readable = fs.createReadStream("input.txt");
const writable = fs.createWriteStream("output.txt");

// Path operations with real files
const resolve = require("path").resolve;
const realPath = fs.realpathSync(resolve("./test-file"));

// Node.js built-in imports
import { readFile } from "node:fs/promises";
await readFile("data.json", "utf8");

// Third-party fs modules
const fsExtra = require("fs-extra");
fsExtra.copy("src", "dest");
fsExtra.ensureDir("new-directory");

// Glob operations on real files
const glob = require("glob");
const files = glob.sync("src/**/*.js");

// Archive operations
const tar = require("tar");
tar.extract({ file: "archive.tar.gz" });
```

### ✅ Correct

```javascript
// Mock filesystem operations
jest.mock("fs");
const fs = require("fs");

fs.readFileSync.mockReturnValue("mocked content");
fs.writeFileSync.mockImplementation(() => {});

// Use virtual filesystem
const { Volume } = require("memfs");
const vol = new Volume();
vol.fromJSON({
  "/test/file.txt": "content",
  "/test/config.json": '{"key": "value"}',
});

// Mock fs-extra
jest.mock("fs-extra");
const fsExtra = require("fs-extra");
fsExtra.readJson.mockResolvedValue({ key: "value" });

// Use temporary directories with proper cleanup
const os = require("os");
const path = require("path");

describe("File operations", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("creates file", () => {
    const filePath = path.join(tempDir, "test.txt");
    fs.writeFileSync(filePath, "content");
    expect(fs.readFileSync(filePath, "utf8")).toBe("content");
  });
});

// Mock with jest.spyOn
beforeEach(() => {
  jest.spyOn(fs, "readFileSync").mockReturnValue("test data");
  jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});
});

// Use in-memory alternatives
const mockFs = {
  files: new Map(),
  readFileSync(path) {
    return this.files.get(path) || "";
  },
  writeFileSync(path, content) {
    this.files.set(path, content);
  },
  existsSync(path) {
    return this.files.has(path);
  },
};

// Test with mocked data
test("processes file content", () => {
  mockFs.writeFileSync("/test/data.txt", "test content");
  const result = processFile("/test/data.txt", mockFs);
  expect(result).toBe("processed: test content");
});

// Mock third-party modules
jest.mock("glob");
const glob = require("glob");
glob.sync.mockReturnValue(["file1.js", "file2.js"]);

// Use dependency injection for testability
function createFileProcessor(fileSystem = fs) {
  return {
    processFile(path) {
      const content = fileSystem.readFileSync(path, "utf8");
      return content.toUpperCase();
    },
  };
}

// Test with injected mock
const mockFileSystem = {
  readFileSync: jest.fn().mockReturnValue("hello world"),
};
const processor = createFileProcessor(mockFileSystem);
```

## Best Practices

### 1. Mock Filesystem Modules

Always mock filesystem operations in unit tests:

```javascript
// Setup mocking
jest.mock("fs");
jest.mock("fs/promises");

// Import after mocking
const fs = require("fs");
const fsPromises = require("fs/promises");

// Configure mocks
beforeEach(() => {
  fs.readFileSync.mockReturnValue("test content");
  fs.existsSync.mockReturnValue(true);
  fsPromises.readFile.mockResolvedValue("async content");
});
```

### 2. Use Virtual Filesystems

Use virtual filesystem libraries for integration tests:

```javascript
const { Volume } = require("memfs");
const { ufs } = require("unionfs");
const realFs = require("fs");

describe("File processing", () => {
  let mockFs;

  beforeEach(() => {
    const vol = new Volume();
    vol.fromJSON({
      "/project/package.json": JSON.stringify({ name: "test" }),
      "/project/src/index.js": 'module.exports = "hello";',
    });

    // Union virtual and real fs
    mockFs = ufs.use(vol).use(realFs);
  });

  test("reads project files", () => {
    const pkg = JSON.parse(mockFs.readFileSync("/project/package.json"));
    expect(pkg.name).toBe("test");
  });
});
```

### 3. Use Temporary Directories Properly

When filesystem operations are necessary, use proper cleanup:

```javascript
const os = require("os");
const path = require("path");

describe("Integration tests", () => {
  let testDir;

  beforeEach(async () => {
    testDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "integration-test-"),
    );
  });

  afterEach(async () => {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  test("creates and reads files", async () => {
    const filePath = path.join(testDir, "test.txt");
    await fs.promises.writeFile(filePath, "content");
    const content = await fs.promises.readFile(filePath, "utf8");
    expect(content).toBe("content");
  });
});
```

### 4. Use Dependency Injection

Make filesystem dependencies injectable for easier testing:

```javascript
// Instead of direct fs usage
function saveConfig(config) {
  fs.writeFileSync("config.json", JSON.stringify(config));
}

// Use dependency injection
function createConfigManager(fileSystem = fs) {
  return {
    saveConfig(config) {
      fileSystem.writeFileSync("config.json", JSON.stringify(config));
    },
    loadConfig() {
      return JSON.parse(fileSystem.readFileSync("config.json", "utf8"));
    },
  };
}

// Test with mock filesystem
const mockFs = {
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('{"key": "value"}'),
};

const configManager = createConfigManager(mockFs);
```

### 5. Mock Third-Party FS Libraries

Mock filesystem-related third-party libraries:

```javascript
// Mock fs-extra
jest.mock("fs-extra");
const fsExtra = require("fs-extra");

beforeEach(() => {
  fsExtra.readJson.mockResolvedValue({ version: "1.0.0" });
  fsExtra.writeJson.mockResolvedValue();
  fsExtra.ensureDir.mockResolvedValue();
});

// Mock glob
jest.mock("glob");
const glob = require("glob");

beforeEach(() => {
  glob.sync.mockReturnValue(["file1.js", "file2.js"]);
});

// Mock chokidar (file watcher)
jest.mock("chokidar");
const chokidar = require("chokidar");

beforeEach(() => {
  const mockWatcher = {
    on: jest.fn().mockReturnThis(),
    close: jest.fn(),
  };
  chokidar.watch.mockReturnValue(mockWatcher);
});
```

### 6. Test with Fixtures

Use fixture files for integration tests:

```javascript
const path = require("path");

const FIXTURES_DIR = path.join(__dirname, "fixtures");

describe("File parser", () => {
  beforeAll(() => {
    // Ensure fixtures directory exists and is populated
    // This should be done in test setup, not in tests
  });

  test("parses valid JSON file", () => {
    const fixturePath = path.join(FIXTURES_DIR, "valid.json");
    const result = parseJsonFile(fixturePath);
    expect(result).toEqual({ valid: true });
  });
});
```

## Framework-Specific Examples

### Jest

```javascript
// Mock at the top level
jest.mock("fs");
jest.mock("fs/promises");

const fs = require("fs");
const fsPromises = require("fs/promises");

describe("File operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.readFileSync.mockReturnValue("default content");
  });

  test("reads configuration", () => {
    fs.readFileSync.mockReturnValue('{"debug": true}');
    const config = loadConfig();
    expect(config.debug).toBe(true);
  });
});
```

### Vitest

```javascript
import { vi } from "vitest";
import fs from "fs";

// Mock filesystem
vi.mock("fs");

describe("File operations", () => {
  beforeEach(() => {
    vi.mocked(fs.readFileSync).mockReturnValue("test content");
  });

  test("processes file", () => {
    const result = processFile("test.txt");
    expect(result).toBe("TEST CONTENT");
  });
});
```

### Node.js with memfs

```javascript
const { fs } = require("memfs");

describe("File system tests", () => {
  beforeEach(() => {
    // Reset virtual filesystem
    fs.vol.reset();

    // Setup test files
    fs.vol.fromJSON({
      "/app/config.json": '{"name": "test-app"}',
      "/app/data.txt": "sample data",
    });
  });

  test("reads config file", () => {
    const config = JSON.parse(fs.readFileSync("/app/config.json", "utf8"));
    expect(config.name).toBe("test-app");
  });
});
```

## Common Filesystem Anti-patterns

### Direct File Creation

```javascript
// ❌ Creates real files
fs.writeFileSync("test-output.txt", result);

// ✅ Mock or use temp directory
const mockWrite = jest.fn();
fs.writeFileSync = mockWrite;
```

### No Cleanup

```javascript
// ❌ No cleanup of created files
beforeEach(() => {
  fs.writeFileSync("test.txt", "content");
});

// ✅ Proper cleanup
afterEach(() => {
  if (fs.existsSync("test.txt")) {
    fs.unlinkSync("test.txt");
  }
});
```

### Hard-coded Paths

```javascript
// ❌ Hard-coded system paths
fs.readFileSync("/etc/config");

// ✅ Use configurable or mocked paths
const configPath = process.env.CONFIG_PATH || "config.json";
fs.readFileSync(configPath);
```

## When Not To Use It

This rule may not be suitable if:

- You're specifically testing filesystem integrations
- You're building filesystem utilities or tools
- You're testing file upload/download functionality
- You need to test with real file permissions

In these cases:

```javascript
// Disable for integration tests
// eslint-disable-next-line test-flakiness/no-unmocked-fs
const realFile = fs.readFileSync('integration-test-file.txt');

// Or configure to allow temp files
{
  "test-flakiness/no-unmocked-fs": ["error", {
    "allowTempFiles": true,
    "allowInSetup": true
  }]
}
```

## Related Rules

- [no-global-state-mutation](./no-global-state-mutation.md) - Prevents global state changes
- [no-test-isolation](./no-test-isolation.md) - Ensures test independence
- [no-random-data](./no-random-data.md) - Prevents non-deterministic test data

## Further Reading

- [memfs - In-memory Filesystem](https://github.com/streamich/memfs)
- [Jest - Mocking Modules](https://jestjs.io/docs/mock-functions)
- [Node.js fs Module](https://nodejs.org/api/fs.html)
- [Testing File Operations](https://nodejs.dev/learn/writing-files-with-nodejs)
- [Temp Directory Best Practices](https://nodejs.org/api/os.html#os_os_tmpdir)
