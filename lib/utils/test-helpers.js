const { RuleTester } = require('eslint');
const semver = require('semver');

/**
 * Creates a configured RuleTester instance based on the ESLint version
 * @param {Object} overrides - Optional configuration overrides
 * @returns {RuleTester} Configured RuleTester instance
 */
function getRuleTester(overrides = {}) {
  // Detect ESLint version for proper RuleTester configuration
  const eslintPackage = require('eslint/package.json');
  const eslintVersion = semver.major(eslintPackage.version);

  const config = {
    ecmaVersion: eslintVersion >= 8 ? 2022 : 2020,
    sourceType: 'module'
  };

  // Only add ecmaFeatures for ESLint 8 and below
  if (eslintVersion <= 8) {
    config.ecmaFeatures = {
      jsx: true
    };
  }

  // For ESLint 7, use @babel/eslint-parser to support modern JS features like top-level await
  if (eslintVersion <= 7) {
    try {
      const parserPath = require.resolve('@babel/eslint-parser');
      config.parser = parserPath;
      config.requireConfigFile = false;
      config.babelOptions = {
        presets: ['@babel/preset-env'],
        parserOpts: {
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true
        }
      };
    } catch (_e) {
      // Fallback to experimental parser options if Babel isn't available
      console.warn('ESLint 7 detected but @babel/eslint-parser not found. Some tests with top-level await may fail.');
      config.allowImportExportEverywhere = true;
      config.allowReturnOutsideFunction = true;
    }
  }

  // Configure RuleTester based on ESLint version
  const defaultConfig = eslintVersion >= 9
      // ESLint 9+ (flat config)
    ? { languageOptions: config }
       // ESLint 8 and 7 (legacy config)
    : {
        parser: config.parser, // Set parser at top level for ESLint 7
        parserOptions: {
          ...config,
          parser: undefined // Remove parser from parserOptions
        }
      };

  // Deep merge overrides with default config
  const mergedConfig = deepMerge(defaultConfig, overrides);

  return new RuleTester(mergedConfig);
}


/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

/**
 * Check if value is an object
 * @param {*} item - Value to check
 * @returns {boolean} True if object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

module.exports = {
  getRuleTester
};