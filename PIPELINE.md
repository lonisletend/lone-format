# Automated CI/CD Pipeline Setup

This document explains how to set up and use the automated publishing pipeline for the lone-format project.

## Overview

The pipeline automatically handles:
1. **Version Bumping**: Automatically increments version in `package.json`
2. **Building**: Compiles and builds the library
3. **Publishing**: Publishes to npmjs.com
4. **Merging**: Merges publish branch to main after successful publish

## Setup Instructions

### 1. Required Secrets

Add the following secrets to your GitHub repository settings:

#### NPM_TOKEN
1. Go to [npmjs.com](https://npmjs.com) and login
2. Click your avatar → "Access Tokens"
3. Click "Generate New Token" → "Automation" (for CI/CD)
4. Copy the token
5. In GitHub: Settings → Secrets and variables → Actions → New repository secret
6. Name: `NPM_TOKEN`, Value: [your token]

### 2. Branch Protection (Optional but Recommended)

Configure branch protection for `main`:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Check "Require status checks to pass before merging"
4. Check "Require branches to be up to date before merging"

## Usage

### Automatic Trigger

Push to the `publish` branch to trigger the pipeline:

```bash
git checkout publish
git add .
git commit -m "feat: add new feature"
git push origin publish
```

### Version Bump Rules

The pipeline automatically determines version bump type from commit messages:

- **Patch** (0.1.6 → 0.1.7): Default for any commit
- **Minor** (0.1.6 → 0.2.0): Commits with `feat:` or `minor:` prefix
- **Major** (0.1.6 → 1.0.0): Commits with `BREAKING CHANGE` or `major:` prefix

### Examples

```bash
# Patch version bump
git commit -m "fix: resolve issue with JSON parsing"

# Minor version bump  
git commit -m "feat: add new theme support"

# Major version bump
git commit -m "major: complete API redesign

BREAKING CHANGE: API has been completely redesigned"
```

### Manual Trigger

You can also trigger the pipeline manually:
1. Go to Actions → "Auto Publish and Merge" workflow
2. Click "Run workflow"
3. Select branch `publish` and version type
4. Click "Run workflow"

## Pipeline Steps

### 1. Build and Publish Job
- Checks out `publish` branch
- Sets up Node.js environment
- Installs dependencies
- Bumps version based on commit message
- Builds the library
- Publishes to npm
- Commits version changes back to `publish`

### 2. Merge to Main Job
- Merges `publish` branch to `main`
- Creates a git tag for the release
- Creates a GitHub release with changelog

## Workflow Files

The project includes two workflow options:

### `publish.yml` - Full Featured
- Includes PR creation and auto-merge
- More complex error handling
- Better for teams with review processes

### `simple-publish.yml` - Streamlined
- Direct merge to main (no PRs)
- Simpler and faster
- Better for solo developers or trusted teams

## Troubleshooting

### Build Failures
If the build fails, the pipeline will still attempt to publish with minimal assets. Check the Actions logs for details.

### NPM Publishing Errors
- Verify `NPM_TOKEN` is set correctly
- Ensure you have publish permissions for the package
- Check if the version already exists on npm

### Merge Conflicts
If merge conflicts occur:
1. Manually resolve conflicts in `publish` branch
2. Push the resolved conflicts
3. The pipeline will retry automatically

## Package Configuration

The `package.json` includes these helpful scripts:

```json
{
  "scripts": {
    "build:lib": "vite build --mode lib",
    "build:lib:full": "vue-tsc -b && vite build --mode lib", 
    "publish:lib": "npm publish --access public",
    "publish:dry": "npm publish --dry-run",
    "version:patch": "npm version patch --no-git-tag-version",
    "version:minor": "npm version minor --no-git-tag-version", 
    "version:major": "npm version major --no-git-tag-version"
  }
}
```

## Security Notes

- Never commit `NPM_TOKEN` to the repository
- Use automation tokens, not personal access tokens
- Regularly rotate your npm tokens
- Monitor npm package downloads and versions

## Support

If you encounter issues with the pipeline:
1. Check the Actions tab for detailed logs
2. Verify all secrets are properly configured
3. Ensure branch permissions are correctly set
4. Review commit message format for version bumping