# Commit Message Guidelines

This document outlines the standards for commit messages in this project. Following these guidelines ensures a clear and descriptive commit history.

## The Format

All commit messages should follow this pattern:

`type(scope): description of what you did`

- **type**: The nature of the change (e.g., `feat`, `fix`).
- **scope** (optional): The part of the codebase affected (e.g., `api`, `ui`).
- **description**: A concise summary of the change.

**Examples:**
- `feat(auth): implement Google sign-in`
- `fix(api): correct pagination error in user endpoint`
- `docs: update installation instructions`
- `refactor: simplify logging module`

---

## Commit Types

- **feat**: A new feature or user-facing change.
- **fix**: A bug fix.
- **docs**: Changes to documentation only.
- **style**: Code formatting changes (e.g., whitespace, semicolons).
- **refactor**: Code changes that neither fix a bug nor add a feature.
- **perf**: A code change that improves performance.
- **test**: Adding or correcting tests.
- **build**: Changes affecting the build system or external dependencies.
- **ci**: Changes to our CI configuration files and scripts.
- **chore**: Routine tasks, maintenance, or dependency updates.
- **revert**: Reverting a previous commit.

---

## Rules
- Start with one of the types above
- Use lowercase for the type
- Keep the header of message under 72 characters
- Keep each line of message with 100 characters
- Don't end with a period
- Be specific about what you changed

---

## Husky Hooks

This project uses [Husky](https://typicode.github.io/husky/) to enforce commit standards automatically. The following hooks are active:

- **`commit-msg`**: This hook runs automatically when you run `git commit`. It uses `commitlint` to check if your commit message meets the required format. If the message is not compliant, the commit will be aborted.

- **`pre-commit`**: This hook runs before the `commit-msg` hook. It is used to run automated checks, such as linting or testing, to ensure code quality before it is committed. If any of these checks fail, the commit will be aborted.

These hooks help maintain a clean and consistent codebase and commit history.

---

## What Happens If You Mess Up?

The system will reject your commit and tell you what's wrong. Just fix the message or the code and try again.

If you installed Commitizen, you can use `npm run commit` to get an interactive prompt that helps you format everything correctly.
