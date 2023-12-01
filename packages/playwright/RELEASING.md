# Release ZeroStep

This document outlines the steps to be followed for releasing new versions of ZeroStep.

## Version Branches

- Each release is a set of changes collected in a version branch named for the next
  version `x.y.z`. Pull requests should be opened against this branch.

## Prerequisites

- Ensure you have the latest codebase from the main branch.
- Have necessary permissions to publish to npm and push to the GitHub repository.

## Steps for Releasing a New Version

### 0. Regression Test

- On your local machine, switch to the version branch and pull the latest changes.
- All provided example tests must work before releasing. Run the tests in the `examples/` directory
  and verify they all pass.

### 1. Update Version in package.json

- Update the version in `package.json` file. Follow [Semantic Versioning](https://semver.org/).

### 2. Update CHANGELOG

- Update the CHANGELOG.md file to include the new version and release notes.
- List down the changes made, bugs fixed, or any enhancements.
- Commit the changes with a message like `bump version to x.y.z`.

### 3. Merge to `main`

- Once the package and CHANGELOG have been updated, open a pull request to merge the version
  branch into main
- Then pull down the latest version of main
  ```
  git checkout main && git pull
  ```

### 4. Create Git Tag

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

### 5. Run Release Script

- Execute the existing release script which builds and publishes to npm.
  ```
  npm run release
  ```

### 6. Create GitHub Release

- Go to the ["Draft New Release" page](https://github.com/zerostep-ai/zerostep/releases/new).
- Select the tag `v[x.y.z]` you just pushed.
- Title the release as `v[x.y.z]`.
- Write custom release notes or copy from CHANGELOG.md.
- Click on "Publish release".

## Post-Release

- Ensure the release is visible on GitHub and the package is updated on [npmjs.org](https://www.npmjs.com/package/@zerostep/playwright).