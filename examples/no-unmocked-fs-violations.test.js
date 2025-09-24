/**
 * Examples of no-unmocked-fs rule violations
 * These patterns should be detected by the eslint-plugin-test-flakiness
 */

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

describe('Unmocked File System Violations', () => {
  // ❌ BAD: Direct fs.readFile without mocking
  it('should not use unmocked fs.readFile', (done) => {
    fs.readFile('/path/to/file.txt', 'utf8', (err, data) => {
      expect(data).toContain('content');
      done();
    });
  });

  // ❌ BAD: Direct fs.writeFile without mocking
  it('should not use unmocked fs.writeFile', (done) => {
    fs.writeFile('/path/to/output.txt', 'test data', (err) => {
      expect(err).toBeNull();
      done();
    });
  });

  // ❌ BAD: Synchronous fs operations
  it('should not use unmocked fs sync methods', () => {
    const data = fs.readFileSync('/path/to/file.txt', 'utf8');
    expect(data).toBeDefined();

    fs.writeFileSync('/path/to/output.txt', 'test data');

    const exists = fs.existsSync('/path/to/file.txt');
    expect(exists).toBe(true);

    const stats = fs.statSync('/path/to/file.txt');
    expect(stats.isFile()).toBe(true);
  });

  // ❌ BAD: fs promises without mocking
  it('should not use unmocked fs promises', async () => {
    const data = await fsPromises.readFile('/path/to/file.txt', 'utf8');
    expect(data).toBeDefined();

    await fsPromises.writeFile('/path/to/output.txt', 'test data');

    const stats = await fsPromises.stat('/path/to/file.txt');
    expect(stats.size).toBeGreaterThan(0);
  });

  // ❌ BAD: Directory operations without mocking
  it('should not use unmocked directory operations', async () => {
    const files = await fsPromises.readdir('/path/to/directory');
    expect(files.length).toBeGreaterThan(0);

    await fsPromises.mkdir('/path/to/new-dir');
    await fsPromises.rmdir('/path/to/old-dir');
  });

  // ❌ BAD: File manipulation without mocking
  it('should not use unmocked file manipulation', async () => {
    await fsPromises.rename('/old/path.txt', '/new/path.txt');
    await fsPromises.unlink('/path/to/delete.txt');
    await fsPromises.copyFile('/source.txt', '/dest.txt');
  });

  // ❌ BAD: Stream operations without mocking
  it('should not use unmocked streams', (done) => {
    const readStream = fs.createReadStream('/path/to/input.txt');
    const writeStream = fs.createWriteStream('/path/to/output.txt');

    readStream.pipe(writeStream);

    writeStream.on('finish', () => {
      expect(true).toBe(true);
      done();
    });
  });

  // ❌ BAD: Watch operations without mocking
  it('should not use unmocked fs.watch', () => {
    const watcher = fs.watch('/path/to/watch', (eventType, filename) => {
      expect(eventType).toBeDefined();
      expect(filename).toBeDefined();
    });

    // Clean up
    watcher.close();
  });

  // ❌ BAD: Path operations that touch filesystem
  it('should not use filesystem-touching path operations', () => {
    const resolved = path.resolve('/path/to/file.txt');
    // This itself is OK, but using it with fs is not
    const data = fs.readFileSync(resolved);
    expect(data).toBeDefined();
  });

  // ❌ BAD: Multiple file operations
  it('should not chain unmocked file operations', async () => {
    // Check if file exists
    const exists = fs.existsSync('/config.json');

    if (!exists) {
      // Create it
      fs.writeFileSync('/config.json', '{}');
    }

    // Read and modify
    const config = JSON.parse(fs.readFileSync('/config.json', 'utf8'));
    config.updated = true;

    // Write back
    fs.writeFileSync('/config.json', JSON.stringify(config));

    expect(config.updated).toBe(true);
  });
});