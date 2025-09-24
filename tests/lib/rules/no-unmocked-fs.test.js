/**
 * @fileoverview Tests for no-unmocked-fs rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-unmocked-fs');
const { getRuleTester } = require('../../../lib/utils/test-helpers');

const ruleTester = getRuleTester();

ruleTester.run('no-unmocked-fs', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'fs.readFileSync("file.txt")',
      filename: 'src/app.js'
    },
    {
      code: 'await fs.promises.writeFile("output.txt", data)',
      filename: 'src/writer.js'
    },

    // Mocked fs operations
    {
      code: 'jest.mock("fs"); fs.readFileSync("file.txt")',
      filename: 'MockedFs.test.js'
    },
    {
      code: 'vi.mock("fs"); fs.writeFileSync("file.txt", data)',
      filename: 'ViMockedFs.test.js'
    },
    {
      code: 'jest.mock("fs/promises"); fs.promises.readFile("file.txt")',
      filename: 'MockedPromises.test.js'
    },

    // Using mock-fs
    {
      code: 'import mockFs from "mock-fs"; mockFs({ "file.txt": "content" }); fs.readFileSync("file.txt")',
      filename: 'MockFsLib.test.js'
    },
    {
      code: 'const mockFs = require("mock-fs"); beforeEach(() => { mockFs({ "test.txt": "data" }); })',
      filename: 'MockFsSetup.test.js'
    },

    // Using memfs
    {
      code: 'import { vol } from "memfs"; vol.fromJSON({ "./file.txt": "content" })',
      filename: 'Memfs.test.js'
    },

    // Spied/stubbed fs methods
    {
      code: 'jest.spyOn(fs, "readFileSync").mockReturnValue("content"); fs.readFileSync("file.txt")',
      filename: 'SpiedFs.test.js'
    },
    {
      code: 'sinon.stub(fs, "writeFileSync"); fs.writeFileSync("file.txt", data)',
      filename: 'StubbedFs.test.js'
    },
    {
      code: 'vi.spyOn(fs.promises, "readFile").mockResolvedValue(Buffer.from("data"))',
      filename: 'SpiedPromises.test.js'
    },

    // Using test fixtures directory
    {
      code: 'fs.readFileSync(path.join(__dirname, "__fixtures__", "test.txt"))',
      filename: 'Fixtures.test.js'
    },
    {
      code: 'fs.readFileSync("./test/fixtures/data.json")',
      filename: 'TestFixtures.test.js'
    },

    // Non-fs modules
    {
      code: 'localStorage.getItem("key")',
      filename: 'LocalStorage.test.js'
    },
    {
      code: 'database.read("table")',
      filename: 'Database.test.js'
    },

    // Option: allowInSetup = true
    {
      code: 'beforeAll(() => { fs.mkdirSync("test-dir"); })',
      filename: 'SetupHook.test.js',
      options: [{ allowInSetup: true }]
    },
    {
      code: 'beforeEach(() => { fs.writeFileSync("test.txt", "data"); })',
      filename: 'BeforeEachSetup.test.js',
      options: [{ allowInSetup: true }]
    },
    {
      code: 'afterAll(() => { fs.rmdirSync("test-dir"); })',
      filename: 'TeardownHook.test.js',
      options: [{ allowInSetup: true }]
    },
    {
      code: 'afterEach(() => { fs.unlinkSync("test.txt"); })',
      filename: 'AfterEachTeardown.test.js',
      options: [{ allowInSetup: true }]
    },

    // Test fs/promises in setup hook with allowInSetup
    {
      code: `
        import { readFile } from 'fs/promises';
        beforeAll(async () => {
          await readFile('config.json');
        });
      `,
      filename: 'PromiseSetup.test.js',
      options: [{ allowInSetup: true }]
    },

    // Test glob in setup hook with allowInSetup
    {
      code: `
        beforeEach(() => {
          glob.sync('**/*.js');
        });
      `,
      filename: 'GlobSetup.test.js',
      options: [{ allowInSetup: true }]
    },

    // Test fast-glob in setup hook with allowInSetup and allowedModules
    {
      code: `
        import fg from 'fast-glob';
        beforeAll(() => {
          fg.sync('**/*.test.js');
        });
      `,
      filename: 'FastGlobSetup.test.js',
      options: [{ allowInSetup: true, allowedModules: ['fast-glob'] }]
    },

    // Test rimraf in setup hook with allowInSetup
    {
      code: `
        afterEach(() => {
          rimraf.sync('temp/**');
        });
      `,
      filename: 'RimrafSetup.test.js',
      options: [{ allowInSetup: true }]
    },

    // Test path operations in setup hook with allowInSetup - path.readFileSync doesn't exist, removed

    // Test Node fs functions in setup hook with allowInSetup
    {
      code: `
        beforeEach(() => {
          mkdirSync('temp');
        });
      `,
      filename: 'NodeSetup.test.js',
      options: [{ allowInSetup: true }]
    },

    // Test with arrow function inside setup hook
    {
      code: `
        beforeEach(() => {
          const setupFn = () => {
            fs.readFileSync('test.txt');
          };
          setupFn();
        });
      `,
      filename: 'ArrowInSetup.test.js',
      options: [{ allowInSetup: true }]
    },

    // Test with function expression inside setup hook
    {
      code: `
        beforeAll(function() {
          const helper = function() {
            fs.writeFileSync('output.txt', 'data');
          };
          helper();
        });
      `,
      filename: 'FunctionInSetup.test.js',
      options: [{ allowInSetup: true }]
    },

    // Option: allowTempFiles = true (default)
    {
      code: 'const os = require(\'os\'); fs.writeFileSync(path.join(os.tmpdir(), "test.txt"), "data")',
      filename: 'TempFile.test.js',
      options: [{ allowTempFiles: true }]
    },
    {
      code: 'fs.writeFileSync("/tmp/test-file.txt", "data")',
      filename: 'TmpDir.test.js',
      options: [{ allowTempFiles: true }]
    },
    {
      code: 'fs.readFileSync("/var/tmp/data.json")',
      filename: 'VarTmp.test.js',
      options: [{ allowTempFiles: true }]
    },

    // Option: allowedModules
    {
      code: 'const fsExtra = require("fs-extra"); fsExtra.readJson("package.json")',
      filename: 'AllowedFsExtra.test.js',
      options: [{ allowedModules: ['fs-extra'] }]
    },
    {
      code: 'const fse = require("fs-extra"); fse.copy("src", "dest")',
      filename: 'AllowedFseModule.test.js',
      options: [{ allowedModules: ['fs-extra'] }]
    },
    {
      code: 'glob.sync("**/*.js")',
      filename: 'AllowedGlob.test.js',
      options: [{ allowedModules: ['glob'] }]
    },
    {
      code: 'rimraf.sync("build")',
      filename: 'AllowedRimraf.test.js',
      options: [{ allowedModules: ['rimraf'] }]
    },
    {
      code: 'fs.readFileSync("file.txt")',
      filename: 'AllowedFs.test.js',
      options: [{ allowedModules: ['fs'] }]
    },
    {
      code: 'fs.promises.readFile("file.txt")',
      filename: 'AllowedFsPromises.test.js',
      options: [{ allowedModules: ['fs/promises'] }]
    },

    // Option: mockModules (custom modules to check for mocking)
    {
      code: 'jest.mock("custom-fs"); customFs.read("file.txt")',
      filename: 'CustomMockModule.test.js',
      options: [{ mockModules: ['custom-fs'] }]
    },

    // Option: allowedPaths
    {
      code: 'fs.readFileSync("/allowed/path/file.txt")',
      filename: 'AllowedPath.test.js',
      options: [{ allowedPaths: ['/allowed/path'] }]
    },
    {
      code: 'fs.writeFileSync("/data/test.txt", "content")',
      filename: 'AllowedPathWrite.test.js',
      options: [{ allowedPaths: ['/data'] }]
    },

    // Combined options with setup hooks and modules
    {
      code: 'beforeAll(() => { const fse = require("fs-extra"); fse.ensureDir("test"); })',
      filename: 'SetupWithAllowedModule.test.js',
      options: [{ allowInSetup: true, allowedModules: ['fs-extra'] }]
    },
    {
      code: 'afterEach(() => { glob.sync("temp/**/*"); })',
      filename: 'TeardownWithAllowedGlob.test.js',
      options: [{ allowInSetup: true, allowedModules: ['glob'] }]
    },
    {
      code: 'beforeEach(() => { rimraf.sync("dist"); })',
      filename: 'SetupWithAllowedRimraf.test.js',
      options: [{ allowInSetup: true, allowedModules: ['rimraf'] }]
    },

    // Path operations that don't touch filesystem
    {
      code: 'path.join("/test", "file.txt")',
      filename: 'PathJoin.test.js'
    },
    {
      code: 'path.resolve("./file.txt")',
      filename: 'PathResolve.test.js'
    },
    {
      code: 'path.dirname("/test/file.txt")',
      filename: 'PathDirname.test.js'
    },
    {
      code: 'path.basename("/test/file.txt")',
      filename: 'PathBasename.test.js'
    }
  ],

  invalid: [
    // Direct fs.readFile usage
    {
      code: 'fs.readFile("file.txt", callback)',
      filename: 'ReadFile.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFile' }
      }]
    },
    {
      code: 'fs.readFileSync("file.txt")',
      filename: 'ReadFileSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },

    // Direct fs.writeFile usage
    {
      code: 'fs.writeFile("output.txt", data, callback)',
      filename: 'WriteFile.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFile' }
      }]
    },
    {
      code: 'fs.writeFileSync("output.txt", data)',
      filename: 'WriteFileSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFileSync' }
      }]
    },

    // fs.promises usage
    {
      code: 'await fs.promises.readFile("file.txt")',
      filename: 'PromisesRead.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFile' }
      }]
    },
    {
      code: 'fs.promises.writeFile("output.txt", data)',
      filename: 'PromisesWrite.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFile' }
      }]
    },

    // Other fs methods
    {
      code: 'fs.appendFile("log.txt", data, callback)',
      filename: 'AppendFile.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'appendFile' }
      }]
    },
    {
      code: 'fs.appendFileSync("log.txt", data)',
      filename: 'AppendFileSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'appendFileSync' }
      }]
    },
    {
      code: 'fs.unlink("file.txt", callback)',
      filename: 'Unlink.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'unlink' }
      }]
    },
    {
      code: 'fs.unlinkSync("file.txt")',
      filename: 'UnlinkSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'unlinkSync' }
      }]
    },
    {
      code: 'fs.mkdir("newdir", callback)',
      filename: 'Mkdir.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'mkdir' }
      }]
    },
    {
      code: 'fs.mkdirSync("newdir")',
      filename: 'MkdirSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'mkdirSync' }
      }]
    },
    {
      code: 'fs.rmdir("dir", callback)',
      filename: 'Rmdir.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'rmdir' }
      }]
    },
    {
      code: 'fs.rmdirSync("dir")',
      filename: 'RmdirSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'rmdirSync' }
      }]
    },
    {
      code: 'fs.rename("old.txt", "new.txt", callback)',
      filename: 'Rename.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'rename' }
      }]
    },
    {
      code: 'fs.renameSync("old.txt", "new.txt")',
      filename: 'RenameSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'renameSync' }
      }]
    },
    {
      code: 'fs.copyFile("source.txt", "dest.txt", callback)',
      filename: 'CopyFile.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'copyFile' }
      }]
    },
    {
      code: 'fs.copyFileSync("source.txt", "dest.txt")',
      filename: 'CopyFileSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'copyFileSync' }
      }]
    },

    // fs.stat and related
    {
      code: 'fs.stat("file.txt", callback)',
      filename: 'Stat.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'stat' }
      }]
    },
    {
      code: 'fs.statSync("file.txt")',
      filename: 'StatSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'statSync' }
      }]
    },
    {
      code: 'fs.lstat("link", callback)',
      filename: 'Lstat.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'lstat' }
      }]
    },
    {
      code: 'fs.access("file.txt", fs.constants.F_OK, callback)',
      filename: 'Access.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'access' }
      }]
    },
    {
      code: 'fs.accessSync("file.txt")',
      filename: 'AccessSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'accessSync' }
      }]
    },
    {
      code: 'fs.exists("file.txt", callback)',
      filename: 'Exists.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'exists' }
      }]
    },
    {
      code: 'fs.existsSync("file.txt")',
      filename: 'ExistsSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'existsSync' }
      }]
    },

    // Directory operations
    {
      code: 'fs.readdir("dir", callback)',
      filename: 'Readdir.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readdir' }
      }]
    },
    {
      code: 'fs.readdirSync("dir")',
      filename: 'ReaddirSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readdirSync' }
      }]
    },

    // Stream operations
    {
      code: 'fs.createReadStream("file.txt")',
      filename: 'ReadStream.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'createReadStream' }
      }]
    },
    {
      code: 'fs.createWriteStream("output.txt")',
      filename: 'WriteStream.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'createWriteStream' }
      }]
    },

    // Watch operations
    {
      code: 'fs.watch("file.txt", callback)',
      filename: 'Watch.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'watch' }
      }]
    },
    {
      code: 'fs.watchFile("file.txt", callback)',
      filename: 'WatchFile.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'watchFile' }
      }]
    },

    // Import variations
    {
      code: 'import { readFileSync } from "fs"; readFileSync("file.txt")',
      filename: 'ImportNamed.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },
    {
      code: 'const { writeFile } = require("fs"); writeFile("file.txt", data, cb)',
      filename: 'RequireDestructured.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFile' }
      }]
    },

    // Multiple violations
    {
      code: `
        fs.readFileSync("input.txt");
        fs.writeFileSync("output.txt", data);
        fs.unlinkSync("temp.txt");
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'mockFs', data: { method: 'readFileSync' } },
        { messageId: 'mockFs', data: { method: 'writeFileSync' } },
        { messageId: 'mockFs', data: { method: 'unlinkSync' } }
      ]
    },

    // In test blocks
    {
      code: 'it("reads file", () => { const content = fs.readFileSync("file.txt"); })',
      filename: 'TestBlock.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },
    {
      code: 'test("writes file", async () => { await fs.promises.writeFile("out.txt", data); })',
      filename: 'AsyncTest.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFile' }
      }]
    },

    // Different test file extensions
    {
      code: 'fs.readFileSync("file.txt")',
      filename: 'Read.spec.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },
    {
      code: 'fs.writeFileSync("output.txt", data)',
      filename: 'test/write.test.ts',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFileSync' }
      }]
    },
    {
      code: 'fs.unlinkSync("temp.txt")',
      filename: '__tests__/unlink.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'unlinkSync' }
      }]
    },

    // Option: allowInSetup = false (default) - should error
    {
      code: 'beforeAll(() => { fs.mkdirSync("test-dir"); })',
      filename: 'SetupNotAllowed.test.js',
      options: [{ allowInSetup: false }],
      errors: [{
        messageId: 'mockFs',
        data: { method: 'mkdirSync' }
      }]
    },
    {
      code: 'beforeEach(() => { fs.writeFileSync("test.txt", "data"); })',
      filename: 'BeforeEachNotAllowed.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFileSync' }
      }]
    },

    // Option: allowTempFiles = false - should error for temp files
    {
      code: 'fs.writeFileSync("/tmp/test-file.txt", "data")',
      filename: 'TmpNotAllowed.test.js',
      options: [{ allowTempFiles: false }],
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFileSync' }
      }]
    },
    {
      code: 'const os = require(\'os\'); fs.writeFileSync(path.join(os.tmpdir(), "test.txt"), "data")',
      filename: 'OsTmpDirNotAllowed.test.js',
      options: [{ allowTempFiles: false }],
      errors: [{
        messageId: 'mockFs',
        data: { method: 'writeFileSync' }
      }]
    },

    // Option: allowedModules doesn't include the module being used
    {
      code: 'const fsExtra = require("fs-extra"); fsExtra.readJson("package.json")',
      filename: 'FsExtraNotAllowed.test.js',
      options: [{ allowedModules: ['glob'] }], // fs-extra not in allowed
      errors: [{
        messageId: 'mockFs',
        data: { method: 'fs-extra.readJson' }
      }]
    },
    {
      code: 'glob.sync("**/*.js")',
      filename: 'GlobNotAllowed.test.js',
      options: [{ allowedModules: ['fs-extra'] }], // glob not in allowed
      errors: [{
        messageId: 'mockFs',
        data: { method: 'glob' }
      }]
    },

    // Option: mockModules with custom modules that aren't mocked
    {
      code: 'fs.readFileSync("file.txt")',
      filename: 'CustomModulesNotMocked.test.js',
      options: [{ mockModules: ['custom-fs', 'my-fs'] }], // fs not in mockModules
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },

    // Test fs-extra operations
    {
      code: 'const fse = require("fs-extra"); fse.ensureDir("new-directory")',
      filename: 'FsExtraEnsureDir.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'fs-extra.ensureDir' }
      }]
    },
    {
      code: 'const fsExtra = require("fs-extra"); fsExtra.copy("src", "dest")',
      filename: 'FsExtraCopy.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'fs-extra.copy' }
      }]
    },

    // Test glob operations
    {
      code: 'glob("**/*.js", callback)',
      filename: 'GlobPattern.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'glob' }
      }]
    },
    {
      code: 'globSync("src/**/*.ts")',
      filename: 'GlobSyncPattern.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'globSync' }
      }]
    },

    // Test fast-glob operations
    {
      code: 'fg.sync("**/*.js")',
      filename: 'FastGlob.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'fast-glob' }
      }]
    },

    // Test rimraf operations
    {
      code: 'rimraf("build")',
      filename: 'Rimraf.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'rimraf' }
      }]
    },
    {
      code: 'rimraf.sync("dist")',
      filename: 'RimrafSync.test.js',
      errors: [{
        messageId: 'mockFs',
        data: { method: 'rimraf' }
      }]
    },

    // Combined options test: allowInSetup but not in setup
    {
      code: 'it("test", () => { fs.readFileSync("file.txt"); })',
      filename: 'NotInSetup.test.js',
      options: [{ allowInSetup: true }],
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },

    // Multiple options combined
    {
      code: 'fs.readFileSync("/home/user/file.txt")',
      filename: 'MultipleOptions.test.js',
      options: [{
        allowTempFiles: true,
        allowInSetup: false,
        allowedModules: ['glob'],
        allowedPaths: ['/var/data']
      }],
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },

    // Child process operations that might touch filesystem
    {
      code: 'child_process.exec("rm -rf /tmp/test")',
      filename: 'ChildProcessExec.test.js',
      errors: [{
        messageId: 'needsMock'
      }]
    },
    {
      code: 'child_process.execSync("ls -la")',
      filename: 'ChildProcessExecSync.test.js',
      errors: [{
        messageId: 'needsMock'
      }]
    },
    {
      code: 'child_process.spawn("rm", ["-rf", "/tmp/test"])',
      filename: 'ChildProcessSpawn.test.js',
      errors: [{
        messageId: 'needsMock'
      }]
    },
    {
      code: 'child_process.spawnSync("touch", ["file.txt"])',
      filename: 'ChildProcessSpawnSync.test.js',
      errors: [{
        messageId: 'needsMock'
      }]
    },

    // Path operations that might involve fs (non-safe methods)
    {
      code: 'path.exists("/test/file.txt")',
      filename: 'PathExists.test.js',
      errors: [{
        messageId: 'avoidRealFs'
      }]
    },

    // Test that when allowInSetup is true but path/module restrictions apply, it should still error
    // These tests verify that allowInSetup doesn't override path/module restrictions
    {
      code: 'fs.readFileSync("/not/allowed/path.txt")',
      filename: 'DisallowedPath.test.js',
      options: [{
        allowedPaths: ['/allowed']
      }],
      errors: [{
        messageId: 'mockFs',
        data: { method: 'readFileSync' }
      }]
    },
    {
      code: 'fsExtra.copy("src", "dest")',
      filename: 'DisallowedModule.test.js',
      options: [{
        allowedModules: ['glob']  // fs-extra not allowed
      }],
      errors: [{
        messageId: 'mockFs',
        data: { method: 'fs-extra.copy' }
      }]
    }
  ]
});