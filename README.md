# eslint-plugin-test-flakiness

> ESLint plugin to detect and prevent flaky test patterns

[![npm version](https://img.shields.io/npm/v/eslint-plugin-test-flakiness.svg)](https://www.npmjs.com/package/eslint-plugin-test-flakiness)
[![npm downloads](https://img.shields.io/npm/dm/eslint-plugin-test-flakiness.svg)](https://www.npmjs.com/package/eslint-plugin-test-flakiness)
[![CI Status](https://github.com/tigredonorte/eslint-plugin-test-flakiness/actions/workflows/ci.yml/badge.svg)](https://github.com/tigredonorte/eslint-plugin-test-flakiness/actions/workflows/ci.yml)
[![Coverage Status](https://img.shields.io/codecov/c/github/tigredonorte/eslint-plugin-test-flakiness)](https://codecov.io/gh/tigredonorte/eslint-plugin-test-flakiness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Catch flaky test patterns before they cause intermittent failures in your CI/CD pipeline. This plugin identifies common anti-patterns that lead to flaky tests and provides automatic fixes where possible.

**[🚀 Try it live in StackBlitz](https://stackblitz.com/github/tigredonorte/eslint-plugin-test-flakiness/tree/main/playground)** | **[📦 View on NPM](https://www.npmjs.com/package/eslint-plugin-test-flakiness)**

## Features

- **Comprehensive Detection**: Identifies 15+ types of flaky patterns
- **Auto-fixable**: Many rules include automatic fixes
- **Framework Support**: Works with Jest, Vitest, Testing Library, Playwright, Cypress
- **Risk-based**: Rules categorized by flakiness risk (high/medium/low)
- **Fast**: Runs at lint-time, no runtime overhead
- **Configurable**: Tune rules to match your team's needs

## Installation

> **Note:** This project uses pnpm 10.15.1 for package management. Install it with `npm install -g pnpm@10.15.1`

```bash
pnpm add -D eslint-plugin-test-flakiness
```

or with npm/yarn (though pnpm is recommended):

```bash
npm install --save-dev eslint-plugin-test-flakiness
# or
yarn add -D eslint-plugin-test-flakiness
```

## Quick Start

### Flat Config (ESLint 9+)

```javascript
// eslint.config.js
import testFlakiness from "eslint-plugin-test-flakiness";

export default [
  {
    plugins: {
      "test-flakiness": testFlakiness,
    },
    rules: {
      // Start with recommended rules
      ...testFlakiness.configs.recommended.rules,

      // Override specific rules as needed
      "test-flakiness/no-hard-coded-timeout": [
        "error",
        {
          maxTimeout: 100, // Allow timeouts under 100ms
        },
      ],

      // Turn off rules that don't apply to your project
      "test-flakiness/no-animation-wait": "off",
    },
  },
];
```

### Legacy Config (.eslintrc)

```json
{
  "plugins": ["test-flakiness"],
  "extends": ["plugin:test-flakiness/recommended"],
  "rules": {
    // Override specific rules
    "test-flakiness/no-hard-coded-timeout": [
      "error",
      {
        "maxTimeout": 100
      }
    ],
    "test-flakiness/no-animation-wait": "off"
  }
}
```

## Available Configurations

### `recommended`

Balanced configuration for most projects. Enables high-risk rules as errors and medium-risk as warnings.

```json
{
  "extends": ["plugin:test-flakiness/recommended"]
}
```

### `strict`

Zero-tolerance for flaky patterns. All rules enabled as errors.

```json
{
  "extends": ["plugin:test-flakiness/strict"]
}
```

### `all`

Enables all available rules as errors. Use with caution.

```json
{
  "extends": ["plugin:test-flakiness/all"]
}
```

## Rules

### High Risk

Rules that frequently cause test failures in CI/CD environments.

| Rule                                                               | Why it matters                                                                       | Auto-fix |                    Docs                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | :------: | :-----------------------------------------: |
| [`no-hard-coded-timeout`](docs/rules/no-hard-coded-timeout.md)     | Hard-coded timeouts like `setTimeout(fn, 1000)` are brittle and fail on slow systems |    ✅    |  [📖](docs/rules/no-hard-coded-timeout.md)  |
| [`await-async-events`](docs/rules/await-async-events.md)           | Missing awaits cause race conditions between actions and assertions                  |    ✅    |   [📖](docs/rules/await-async-events.md)    |
| [`no-immediate-assertions`](docs/rules/no-immediate-assertions.md) | Assertions immediately after state changes miss async updates                        |    ✅    | [📖](docs/rules/no-immediate-assertions.md) |
| [`no-unconditional-wait`](docs/rules/no-unconditional-wait.md)     | Fixed delays don't guarantee operations complete                                     |    ✅    |  [📖](docs/rules/no-unconditional-wait.md)  |
| [`no-promise-race`](docs/rules/no-promise-race.md)                 | Promise.race can produce unpredictable test results                                  |    ❌    |     [📖](docs/rules/no-promise-race.md)     |

### Medium Risk

Rules that cause intermittent failures or maintenance issues.

| Rule                                                                 | Why it matters                                                     | Auto-fix |                     Docs                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ | :------: | :------------------------------------------: |
| [`no-index-queries`](docs/rules/no-index-queries.md)                 | Index-based queries (`:nth-child`, `[0]`) break when order changes |    ❌    |     [📖](docs/rules/no-index-queries.md)     |
| [`no-animation-wait`](docs/rules/no-animation-wait.md)               | Animation timing varies across environments                        |    ❌    |    [📖](docs/rules/no-animation-wait.md)     |
| [`no-global-state-mutation`](docs/rules/no-global-state-mutation.md) | Global state changes affect other tests                            |    ❌    | [📖](docs/rules/no-global-state-mutation.md) |
| [`no-unmocked-network`](docs/rules/no-unmocked-network.md)           | Network calls fail when services are down                          |    ❌    |   [📖](docs/rules/no-unmocked-network.md)    |
| [`no-unmocked-fs`](docs/rules/no-unmocked-fs.md)                     | File system operations are environment-dependent                   |    ❌    |      [📖](docs/rules/no-unmocked-fs.md)      |
| [`no-database-operations`](docs/rules/no-database-operations.md)     | Database state affects test reliability                            |    ❌    |  [📖](docs/rules/no-database-operations.md)  |
| [`no-element-removal-check`](docs/rules/no-element-removal-check.md) | Checking element removal is timing-sensitive                       |    ✅    | [📖](docs/rules/no-element-removal-check.md) |

### Low Risk

Rules that improve test maintainability and reduce edge-case failures.

| Rule                                                           | Why it matters                                     | Auto-fix |                   Docs                    |
| -------------------------------------------------------------- | -------------------------------------------------- | :------: | :---------------------------------------: |
| [`no-random-data`](docs/rules/no-random-data.md)               | Random data makes tests non-reproducible           |    ❌    |    [📖](docs/rules/no-random-data.md)     |
| [`no-long-text-match`](docs/rules/no-long-text-match.md)       | Long text matches break with minor content changes |    ❌    |  [📖](docs/rules/no-long-text-match.md)   |
| [`no-viewport-dependent`](docs/rules/no-viewport-dependent.md) | Tests fail on different screen sizes               |    ❌    | [📖](docs/rules/no-viewport-dependent.md) |
| [`no-focus-check`](docs/rules/no-focus-check.md)               | Focus behavior varies across browsers              |    ❌    |    [📖](docs/rules/no-focus-check.md)     |

### Special Rules

Development and CI/CD specific rules.

| Rule                                                   | Why it matters                                   | Auto-fix |                 Docs                  |
| ------------------------------------------------------ | ------------------------------------------------ | :------: | :-----------------------------------: |
| [`no-test-focus`](docs/rules/no-test-focus.md)         | `.only` and `.focus` skip other tests in CI      |    ✅    |   [📖](docs/rules/no-test-focus.md)   |
| [`no-test-isolation`](docs/rules/no-test-isolation.md) | Tests without proper isolation affect each other |    ❌    | [📖](docs/rules/no-test-isolation.md) |

## Rule Configuration

Each rule can be configured individually:

```javascript
{
  "rules": {
    "test-flakiness/no-hard-coded-timeout": ["error", {
      "maxTimeout": 500,        // Allow timeouts under 500ms
      "allowInSetup": true      // Allow in beforeEach/afterEach
    }],

    "test-flakiness/await-async-events": ["error", {
      "customAsyncMethods": ["myAsyncHelper", "customEvent"]
    }]
  }
}
```

## Examples

### Bad: Hard-coded timeout

```javascript
it("should show notification", async () => {
  showNotification();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  expect(notification).toBeVisible();
});
```

### Good: Using waitFor

```javascript
it("should show notification", async () => {
  showNotification();
  await waitFor(
    () => {
      expect(notification).toBeVisible();
    },
    { timeout: 2000 },
  );
});
```

### Bad: Missing await

```javascript
it("should update on click", () => {
  userEvent.click(button); // Missing await!
  expect(screen.getByText("Updated")).toBeInTheDocument();
});
```

### Good: Properly awaited

```javascript
it("should update on click", async () => {
  await userEvent.click(button);
  expect(await screen.findByText("Updated")).toBeInTheDocument();
});
```

### Bad: Index-based query

```javascript
const thirdItem = container.querySelectorAll(".item")[2];
const lastButton = screen.getAllByRole("button")[buttons.length - 1];
```

### Good: Specific query

```javascript
const specificItem = screen.getByTestId("item-3");
const submitButton = screen.getByRole("button", { name: /submit/i });
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx eslint . --ext .test.js,.test.ts
```

### Pre-commit Hook

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "eslint --ext .test.js,.test.ts"
    }
  }
}
```

### Custom Script for Analysis

```javascript
// analyze-flakiness.js
const {
  analyzeFileContent,
} = require("eslint-plugin-test-flakiness/lib/analyzer");
const fs = require("fs");

const content = fs.readFileSync("my-test.spec.js", "utf8");
const analysis = analyzeFileContent(content, "my-test.spec.js");

if (analysis.riskLevel === "high") {
  console.error("High flakiness risk detected!");
  process.exit(1);
}
```

## Philosophy

This plugin follows these principles:

1. **Prevention over Detection**: Catch issues at lint-time, not runtime
2. **Actionable Feedback**: Every error includes why it's a problem and how to fix it
3. **Progressive Enhancement**: Start with recommended, move to strict as your tests improve
4. **Framework Agnostic**: Core patterns apply regardless of test framework

## How It Works

The plugin uses AST (Abstract Syntax Tree) analysis to detect patterns that commonly cause test flakiness:

- **Timing Issues**: Hard-coded delays, missing awaits
- **Structural Fragility**: Index-based queries, order dependencies
- **State Management**: Global mutations, missing cleanup
- **Network/IO**: Unmocked external calls
- **Non-determinism**: Random data, time-based logic

## Resources

- [Writing Reliable Tests](https://testing-library.com/docs/guide-disappearance)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Cypress Anti-patterns](https://docs.cypress.io/guides/references/best-practices)

## FAQ

**Q: Is this plugin performance-intensive?**
A: No, it runs during ESLint's normal AST traversal with minimal overhead.

**Q: Can I use this with TypeScript?**
A: Yes! It works with `.ts` and `.tsx` test files automatically.

**Q: Does it work with all test frameworks?**
A: It detects patterns common across frameworks. Some rules are framework-specific but will only activate when relevant.

**Q: How do I handle false positives?**
A: You can disable rules inline with `// eslint-disable-next-line test-flakiness/rule-name` or configure rules to be less strict.

## Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/tigredonorte/eslint-plugin-test-flakiness/issues).

## License

MIT © [Your Name]

## Contributing

Contributions are welcome! Please read our [contributing guide](docs/CONTRIBUTING.md) for details.

### Additional Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Complete setup for publishing and CI/CD
- [Commit Guidelines](docs/COMMIT_GUIDELINES.md) - Conventional commit format and examples

---

<div align="center">
Made with care to reduce test flakiness everywhere
</div>
