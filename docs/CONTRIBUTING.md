# Contributing to eslint-plugin-test-flakiness

Thank you for your interest in contributing to eslint-plugin-test-flakiness! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.15.1 (required)
  ```bash
  npm install -g pnpm@10.15.1
  ```

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/tigredonorte/eslint-plugin-test-flakiness.git
   cd eslint-plugin-test-flakiness
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Set up git hooks:
   ```bash
   pnpm prepare
   ```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

#### Adding a New Rule

1. Create the rule file:

   ```bash
   touch lib/rules/your-rule-name.js
   ```

2. Add tests:

   ```bash
   touch tests/lib/rules/your-rule-name.js
   ```

3. Update configurations in `lib/configs/`:
   - Add to `recommended.js` if it should be in the recommended set
   - Add to `strict.js` if it should be in the strict set
   - Always add to `all.js`

4. Document the rule in README.md

#### Rule Structure

```javascript
// lib/rules/your-rule-name.js
module.exports = {
  meta: {
    type: "problem", // or 'suggestion'
    docs: {
      description: "Description of what the rule does",
      category: "Flakiness",
      recommended: true,
    },
    fixable: "code", // if the rule can auto-fix
    schema: [], // for rule options
  },
  create(context) {
    return {
      // AST visitor functions
    };
  },
};
```

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test tests/lib/rules/your-rule-name.js

# Check code style
pnpm lint

# Run type checking (if applicable)
pnpm typecheck
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/) and [Commitizen](http://commitizen.github.io/cz-cli/) for consistent commit messages.

```bash
# Stage your changes
git add .

# Use Commitizen (recommended)
pnpm commit

# Or write conventional commits manually
git commit -m "feat(rules): add no-flaky-pattern rule"
```

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature (minor version bump)
- `fix`: Bug fix (patch version bump)
- `docs`: Documentation only (no release)
- `style`: Code style changes (no release)
- `refactor`: Code refactoring (no release)
- `perf`: Performance improvements (patch version bump)
- `test`: Test changes (no release)
- `chore`: Maintenance (no release)
- `ci`: CI/CD changes (no release)

#### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
git commit -m "feat!: change rule API

BREAKING CHANGE: The rule configuration format has changed"
```

### 5. Push and Create PR

```bash
# Push your branch
git push origin feat/your-feature-name

# Create a pull request on GitHub
```

## Pull Request Guidelines

1. **Title**: Use a conventional commit format
   - Example: `feat(rules): add no-async-without-await rule`

2. **Description**: Include:
   - What changes you made
   - Why you made them
   - Any breaking changes
   - Related issues (use `Fixes #123`)

3. **Tests**: Ensure all tests pass
4. **Documentation**: Update README if needed
5. **Commits**: Keep history clean (squash if needed)

## Testing Guidelines

### Unit Tests

Every rule should have comprehensive tests:

```javascript
// tests/lib/rules/your-rule-name.js
const rule = require("../../../lib/rules/your-rule-name");
const RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();

ruleTester.run("your-rule-name", rule, {
  valid: [
    // Examples of code that should NOT trigger the rule
    "valid.code.example()",
  ],
  invalid: [
    {
      code: "invalid.code.example()",
      errors: [{ message: "Expected error message" }],
      output: "fixed.code.example()", // if fixable
    },
  ],
});
```

### Test Coverage

We aim for high test coverage:

```bash
# Run tests with coverage
pnpm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Add trailing commas in multiline objects/arrays
- Follow ESLint rules (run `pnpm lint`)

## Resources

- [ESLint Developer Guide](https://eslint.org/docs/developer-guide/)
- [Writing ESLint Rules](https://eslint.org/docs/developer-guide/working-with-rules)
- [AST Explorer](https://astexplorer.net/) - Helpful for understanding AST structure
- [ESTree Spec](https://github.com/estree/estree) - JavaScript AST specification

## Reporting Issues

Before creating an issue:

1. Search existing issues
2. Try the latest version
3. Create a minimal reproduction

Include in your issue:

- ESLint version
- Plugin version
- Configuration
- Code example
- Expected vs actual behavior

## Suggesting Features

1. Check if it's already suggested
2. Open a discussion first for major features
3. Explain the use case and benefits
4. Consider if it fits the plugin's scope

## Review Process

1. **Automated checks**: CI must pass
2. **Code review**: Maintainers will review
3. **Testing**: Changes must be tested
4. **Documentation**: Must be updated if needed
5. **Merge**: Squash and merge to main

## Release Process

Releases are automated via semantic-release:

1. Merge PR to `main`
2. CI analyzes commits
3. Version is bumped automatically
4. Package is published to npm
5. GitHub release is created
6. Changelog is updated

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in:

- GitHub contributors page
- Package.json contributors field
- Release notes

## Getting Help

- Open a discussion for questions
- Join our community chat (if available)
- Check the FAQ in the wiki

## Quick Commands Reference

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linter
pnpm lint

# Commit with Commitizen
pnpm commit

# Build (if applicable)
pnpm build

# Link for local testing
pnpm link --global
```

Thank you for contributing!
