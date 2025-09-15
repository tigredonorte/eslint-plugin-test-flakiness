# 🚀 Complete Setup & Deployment Guide

This guide covers the complete setup for `eslint-plugin-test-flakiness` with Husky, Commitizen, and automated releases.

## 📋 Prerequisites

1. **pnpm installed globally**

   ```bash
   npm install -g pnpm@10.15.1
   ```

2. **GitHub Repository**
   - Create at: https://github.com/tigredonorte/eslint-plugin-test-flakiness

3. **NPM Account**
   - Register at: https://www.npmjs.com
   - Verify email address

## 🔧 Initial Setup

### 1. Clone and Install

```bash
# Clone your repository
git clone https://github.com/tigredonorte/eslint-plugin-test-flakiness.git
cd eslint-plugin-test-flakiness

# Copy all the plugin files here

# Install dependencies (will enforce pnpm)
pnpm install

# Install additional dependencies you added
pnpm add -D lint-staged prettier @semantic-release/git conventional-changelog-conventionalcommits

# Setup Husky
pnpm prepare
```

### 2. Fix Missing Dependencies

```bash
# The 'requireindex' is needed for loading rules
pnpm add requireindex

# Make Husky hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### 3. Update Repository URL

Edit `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/tigredonorte/eslint-plugin-test-flakiness.git"
  }
}
```

## 🔑 Authentication Setup

### 1. Generate NPM Token

1. Login to [npmjs.com](https://www.npmjs.com)
2. Go to **Account Settings** → **Access Tokens**
3. Click **"Generate New Token"**
4. Choose **"Automation"** type
5. Copy token (starts with `npm_`)

### 2. Add GitHub Secret

1. Go to your GitHub repo
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `NPM_TOKEN`
5. Value: Your npm token

## 🎯 Development Workflow

### Using Commitizen (Recommended)

```bash
# Stage your changes
git add .

# Use Commitizen for commits (interactive prompt)
pnpm commit

# Or use the shorter alias
npm run commit
```

### Manual Conventional Commits

```bash
# If you prefer manual commits, follow the convention:
git commit -m "feat: add new rule for detecting async issues"
git commit -m "fix: resolve false positive in timeout detection"
git commit -m "docs: update README with examples"
```

### Commit Types & Version Bumps

| Type       | Version Bump          | When to Use              |
| ---------- | --------------------- | ------------------------ |
| `feat`     | Minor (1.0.0 → 1.1.0) | New features/rules       |
| `fix`      | Patch (1.0.0 → 1.0.1) | Bug fixes                |
| `perf`     | Patch                 | Performance improvements |
| `docs`     | No release\*          | Documentation only       |
| `style`    | No release            | Code style changes       |
| `refactor` | No release            | Code refactoring         |
| `test`     | No release            | Test additions/changes   |
| `chore`    | No release            | Maintenance tasks        |
| `ci`       | No release            | CI/CD changes            |
| `build`    | No release            | Build system changes     |
| `revert`   | Patch                 | Reverting commits        |

\*docs changes to README will trigger a patch release

### Breaking Changes

For major version bumps (1.0.0 → 2.0.0):

```bash
# Option 1: In commit message
git commit -m "feat!: change rule configuration format

BREAKING CHANGE: The configuration structure has been completely redesigned"

# Option 2: Using Commitizen (it will prompt for breaking changes)
pnpm commit
# Answer "y" when asked about breaking changes
```

## 🚢 First Release

### 1. Prepare for First Release

```bash
# Update version to 0.0.0-development for semantic-release
# Edit package.json:
"version": "0.0.0-development"

# Commit everything
git add .
git commit -m "feat: initial release of eslint-plugin-test-flakiness

BREAKING CHANGE: First release with comprehensive flaky test detection rules"
```

### 2. Push to Trigger Release

```bash
# Push to main branch
git push -u origin main
```

### 3. Monitor the Release

1. **GitHub Actions**: Check the Actions tab for workflow progress
2. **NPM Package**: Will appear at `npmjs.com/package/eslint-plugin-test-flakiness`
3. **GitHub Releases**: Automatic release with changelog

## 🔄 Ongoing Development

### Daily Workflow

```bash
# 1. Create feature branch
git checkout -b feat/new-rule

# 2. Make changes
# ... edit files ...

# 3. Test locally
pnpm test
pnpm lint

# 4. Commit with Commitizen
pnpm commit

# 5. Push branch
git push origin feat/new-rule

# 6. Create PR to main
# After PR is merged, semantic-release will handle versioning
```

### Adding New Rules

1. Create rule file:

```bash
touch lib/rules/new-rule-name.js
```

2. Update configs:

```javascript
// lib/configs/recommended.js
'test-flakiness/new-rule-name': 'warn'
```

3. Commit:

```bash
pnpm commit
# Type: feat
# Scope: rules
# Message: add new-rule-name to detect X pattern
```

## 🧪 Testing

### Run Tests Locally

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run in watch mode
pnpm test -- --watch
```

### Test the Plugin Locally

```bash
# In the plugin directory
pnpm link --global

# In a test project
pnpm link --global eslint-plugin-test-flakiness

# Create .eslintrc.js
module.exports = {
  plugins: ['test-flakiness'],
  extends: ['plugin:test-flakiness/recommended']
};

# Run ESLint
npx eslint "**/*.test.js"
```

## 📊 CI/CD Pipeline

The GitHub Action will:

1. **Trigger** on push to `main`
2. **Install** dependencies with pnpm
3. **Run** linter and tests
4. **Analyze** commits since last release
5. **Determine** version bump
6. **Update** version in package.json
7. **Generate** CHANGELOG.md
8. **Publish** to NPM with provenance
9. **Create** GitHub release
10. **Commit** changes back to repo

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. "Please use pnpm" error

```bash
# Ensure you're using pnpm
npm install -g pnpm@10.15.1
pnpm install
```

#### 2. Husky hooks not running

```bash
# Reinstall Husky
pnpm prepare
chmod +x .husky/*
```

#### 3. Commitlint failing

```bash
# Check your commit message format
# Must follow: type(scope): description
# Example: feat(rules): add new timeout detection
```

#### 4. No release created

- Check commit messages follow conventional format
- Ensure commits are to `main` branch
- Verify NPM_TOKEN is set correctly

#### 5. NPM publish fails

```bash
# Check package name availability
npm view eslint-plugin-test-flakiness

# If taken, update package.json with a scoped name:
"name": "@yourusername/eslint-plugin-test-flakiness"
```

## 📈 Post-Release

### Verify Installation

```bash
# Install from NPM
npm info eslint-plugin-test-flakiness
pnpm add -D eslint-plugin-test-flakiness

# Test it works
npx eslint --plugin test-flakiness --rule 'test-flakiness/no-hard-coded-timeout: error' test.js
```

### Update README Badges

Add to your README.md:

```markdown
[![npm version](https://img.shields.io/npm/v/eslint-plugin-test-flakiness.svg)](https://www.npmjs.com/package/eslint-plugin-test-flakiness)
[![GitHub Actions](https://github.com/tigredonorte/eslint-plugin-test-flakiness/workflows/Semantic%20Release/badge.svg)](https://github.com/tigredonorte/eslint-plugin-test-flakiness/actions)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
```

## 🎉 Success Checklist

- [ ] pnpm 10.15.1 installed
- [ ] Repository created on GitHub
- [ ] NPM account created and verified
- [ ] NPM_TOKEN added to GitHub secrets
- [ ] Dependencies installed with pnpm
- [ ] Husky hooks configured
- [ ] First commit with BREAKING CHANGE pushed
- [ ] GitHub Action runs successfully
- [ ] Package published to NPM
- [ ] Test installation works

## 📚 Resources

- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitizen Documentation](http://commitizen.github.io/cz-cli/)
- [pnpm Documentation](https://pnpm.io/)
- [ESLint Plugin Developer Guide](https://eslint.org/docs/developer-guide/working-with-plugins)

---

**Questions?** Open an issue on GitHub or check the [FAQ](https://github.com/tigredonorte/eslint-plugin-test-flakiness/wiki/FAQ)
