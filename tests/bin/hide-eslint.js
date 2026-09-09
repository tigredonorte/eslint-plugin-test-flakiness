'use strict';

// Preloaded into a child process to make `require('eslint')` fail the way an install without the
// optional peer does. Resolution is patched rather than the filesystem touched, so the test proves
// the CLI's own guard instead of proving that a directory can be renamed.
const Module = require('module');

const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, ...rest) {
  if (request === 'eslint' || request.startsWith('eslint/')) {
    const error = new Error(`Cannot find module '${request}'`);
    error.code = 'MODULE_NOT_FOUND';
    throw error;
  }
  return resolveFilename.call(this, request, ...rest);
};
