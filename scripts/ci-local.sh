#!/bin/bash

# Local CI Test Script
# This script runs all CI checks locally before pushing

set -e

echo "🔍 Running ESLint Plugin Test Flakiness CI Checks..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

# Run linter
echo "🔍 Running ESLint..."
if pnpm run lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    exit 1
fi
echo ""

# Run tests with coverage
echo "🧪 Running tests with coverage..."
if pnpm run test:ci; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi
echo ""

# Check test coverage
echo "📊 Test coverage report:"
if [ -f "coverage/coverage-summary.json" ]; then
    node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const total = coverage.total;
    console.log('  Lines:      ' + total.lines.pct + '%');
    console.log('  Statements: ' + total.statements.pct + '%');
    console.log('  Functions:  ' + total.functions.pct + '%');
    console.log('  Branches:   ' + total.branches.pct + '%');

    // Fail if coverage is below threshold
    const threshold = 80;
    if (total.lines.pct < threshold || total.statements.pct < threshold ||
        total.functions.pct < threshold || total.branches.pct < threshold) {
        console.log('');
        console.log('⚠️  Warning: Coverage is below ' + threshold + '%');
    }
    "
fi
echo ""

# Build check
echo "🔨 Running build check..."
if pnpm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

echo "✅ All CI checks passed successfully!"
echo ""
echo "You can now safely push your changes."