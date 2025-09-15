/**
 * @fileoverview Tests for no-unmocked-fs rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-unmocked-fs');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

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
    }
  ]
});