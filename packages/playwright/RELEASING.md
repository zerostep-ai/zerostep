# Release ZeroStep

This document outlines the steps to be followed for releasing new versions of ZeroStep.

## Prerequisites

- Ensure you have the latest codebase from the main branch.
- Have necessary permissions to publish to npm and push to the GitHub repository.

## Steps for Releasing a New Version

### 0. Regression Test

- All provided example tests must work before releasing. Run the tests in the examples/ directory
  and verify they all pass.

### 1. Update Version in package.json

- On your local machine, switch to the main branch and pull the latest changes.
- Run the `npm version` command to update the version. This command follows the [Semantic Versioning](https://semver.org/) guidelines. Use one of the following based on the type of release:
  - `npm version patch` - for a patch release (x.y.z -> x.y.z+1)
  - `npm version minor` - for a minor release (x.y.z -> x.y+1.0)
  - `npm version major` - for a major release (x.y.z -> x+1.0.0)
- This command will automatically update the `package.json` file, commit the changes, and tag the commit.
- Push the commit and tag to the GitHub repository:
  ```sh
  git push && git push --tags;
  ```

### 2. Update CHANGELOG

- Update the CHANGELOG.md file to include the new version and release notes.
- List down the changes made, bugs fixed, or any enhancements.
- Commit the changes with a message
  ```sh
  git add --all && git commit -m 'update changelog for x.y.z release'`;
  ```

### 3. Run Release Script

- Execute the existing release script which builds and publishes to npm.
  ```
  npm run release
  ```
- Ensure the script runs successfully and the package is published to [npmjs.org](https://www.npmjs.com/package/@zerostep/playwright).

### 4. Create GitHub Release

- Go to the ["Draft New Release" page](https://github.com/zerostep-ai/zerostep/releases/new).
- Select the tag `v[x.y.z]` you just pushed.
- Title the release as `v[x.y.z]`.
- Write custom release notes or copy from CHANGELOG.md.
- Click on "Publish release".

## Post-Release

- Ensure the release is visible on GitHub and the package is updated on [npmjs.org](https://www.npmjs.com/package/@zerostep/playwright).