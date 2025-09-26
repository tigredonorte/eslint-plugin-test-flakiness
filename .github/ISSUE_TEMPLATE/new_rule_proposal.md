---
name: New Rule Proposal
about: Suggest a new flaky test pattern to detect
title: "[Rule Proposal] "
labels: "rule-proposal, needs-triage"
assignees: ""
---

## Flaky Pattern Description

### What test pattern causes flakiness?

Describe the anti-pattern that leads to flaky tests.

## Real-World Example

```javascript
// Show a real example of the flaky pattern
// Include the test code that demonstrates the problem
```

## Why This Causes Flakiness

Explain why this pattern leads to intermittent test failures:

- Environment dependencies?
- Timing issues?
- State management problems?
- Other factors?

## How Common Is This Pattern?

- [ ] Very common (seen in most test suites)
- [ ] Common (seen regularly)
- [ ] Uncommon (occasional occurrence)
- [ ] Rare (edge case)

## Proposed Rule Details

### Rule name: `no-[pattern-name]`

### Risk level

- [ ] High (frequently causes CI failures)
- [ ] Medium (occasionally causes issues)
- [ ] Low (minor impact)

### Auto-fixable?

- [ ] Yes (describe the fix)
- [ ] No (explain why)

## Suggested Fix

```javascript
// Show how to fix the flaky pattern
// Include the corrected test code
```

## Framework Compatibility

Which test frameworks does this apply to?

- [ ] Jest
- [ ] Vitest
- [ ] Testing Library
- [ ] Playwright
- [ ] Cypress
- [ ] Framework-agnostic

## Additional Context

Add any other context, links to blog posts, or documentation about this pattern.

---

### Community Voting

React with 👍 to vote for this rule, 👎 if you think it's not needed, or 💭 to discuss alternatives.
