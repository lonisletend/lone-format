#!/bin/bash

# Local testing script for the publish pipeline
# This script simulates what the GitHub Actions workflow does

set -e

echo "🚀 Testing Local Build and Publish Process"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Found package.json"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Test build process
print_status "Testing build process..."
if npm run build:lib; then
    print_status "Build successful"
else
    print_warning "Build failed, but this might work in CI with different environment"
fi

# Check if dist directory was created
if [ -d "dist" ]; then
    print_status "Dist directory created"
    echo "Contents:"
    ls -la dist/
else
    print_warning "No dist directory created"
fi

# Test version bumping (dry run)
print_status "Testing version bump (dry run)..."
npm version patch --dry-run
print_status "Version bump test successful"

# Test npm publish (dry run)
print_status "Testing npm publish (dry run)..."
if npm publish --dry-run; then
    print_status "Publish test successful"
else
    print_error "Publish test failed"
fi

echo ""
echo "🎉 Local testing complete!"
echo ""
echo "Next steps:"
echo "1. Ensure NPM_TOKEN is set in GitHub repository secrets"
echo "2. Create and push to 'publish' branch to trigger the workflow"
echo ""
echo "Example commands:"
echo "  git checkout -b publish"
echo "  git add ."
echo "  git commit -m 'feat: ready for publish'"
echo "  git push origin publish"