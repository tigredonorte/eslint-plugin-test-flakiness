# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of eslint-plugin-test-flakiness seriously.
If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT

- Open a public GitHub issue for security vulnerabilities
- Post about the vulnerability on social media

### Please DO

- Email us directly at: <tigredonorte@users.noreply.github.com>
- Include the word "SECURITY" in the subject line
- Provide as much information as possible about the vulnerability

### What to include

1. Type of issue (e.g., arbitrary code execution, privilege escalation)
2. Full paths of source file(s) related to the issue
3. Location of the affected source code (tag/branch/commit or direct URL)
4. Step-by-step instructions to reproduce the issue
5. Proof-of-concept or exploit code (if possible)
6. Impact of the issue, including how an attacker might exploit it

### What to expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will confirm the vulnerability and determine its impact within 7 days
- **Fix timeline**: We aim to release a fix within 30 days of confirmation
- **Communication**: We will keep you informed about the progress of addressing the vulnerability
- **Credit**: We will credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

When using this plugin:

1. **Keep dependencies updated**: Regularly update eslint-plugin-test-flakiness and its dependencies
2. **Use lock files**: Always commit your `pnpm-lock.yaml` (or equivalent) to ensure reproducible builds
3. **Review configuration**: Ensure your ESLint configuration doesn't expose sensitive information
4. **CI/CD security**: Use secure environment variables and secrets management in your CI/CD pipelines

## Dependency Security

This plugin has minimal dependencies to reduce attack surface:

- Production dependency: `requireindex` (for dynamic rule loading)
- All other dependencies are development-only

We use automated dependency scanning via:

- GitHub Dependabot for vulnerability alerts
- npm audit in our CI pipeline
- Regular manual review of dependencies

## Disclosure Policy

When we receive a security report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions
5. Prominently announce the fix in our release notes

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue to discuss.
