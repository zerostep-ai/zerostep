# Release ZeroStep

This document outlines the steps to be followed for releasing new versions of ZeroStep.

## Prerequisites

- Ensure you have the latest codebase from the main branch.
- Have necessary permissions to publish to npm and push to the GitHub repository.

## Steps for Releasing a New Version

### 0. Regression Test

- On your local machine, switch to the main branch and pull the latest changes.
- All provided example tests must work before releasing. Run the tests in the `examples/` directory
  and verify they all pass.

### 1. Update Version in package.json

- Update the version in `package.json` file. Follow [Semantic Versioning](https://semver.org/).

### 2. Update CHANGELOG

- Update the CHANGELOG.md file to include the new version and release notes.
- List down the changes made, bugs fixed, or any enhancements.
- Commit the changes with a message like `bump version to x.y.z`.

### 3. Create Git Tag

- Tag the current commit with the new version number.
  ```
  git tag -a v[x.y.z] -m "Release x.y.z"
  ```
- Push the tag to the GitHub repository.
  ```
  git push origin v[x.y.z]
  ```
- Push the main branch
  ```
  git push origin main
  ```

### 4. Run Release Script

- Execute the existing release script which builds and publishes to npm.
  ```
  npm run release
  ```

### 5. Create GitHub Release

- Go to the ["Draft New Release" page](https://github.com/zerostep-ai/zerostep/releases/new).
- Select the tag `v[x.y.z]` you just pushed.
- Title the release as `v[x.y.z]`.
- Write custom release notes or copy from CHANGELOG.md.
- Click on "Publish release".

## Post-Release

- Ensure the release is visible on GitHub and the package is updated on [npmjs.org](https://www.npmjs.com/package/@zerostep/playwright).