<p>
  <h1 align="center">
    <b>Publishing instruction for the core team developers.</b>
  </h1>

  <h3 align="center">
    Current release manager ✨<a href='https://github.com/adrastaea'>@adrastaea</a>✨ (August 2025)
  </h3>

  <br />
  <br />
</p>

## Release Trigger

- [ ] [Quiet Planning Board](https://github.com/orgs/TryQuiet/projects/3) is up to date
- [ ] All issues to be included from `Sprint` are merged and moved to `Merged`
- [ ] `Ready for QA` column is empty of issues from previous releases

## Branching Rules

1. Release branches are based on the `develop` branch.
1. Release branches are named after the version number, e.g. `2.1.0` not the pre-release version number, e.g. `2.1.0-alpha.1`.
1. Once a release branch is created, it is frozen and no new features are to be merged into it. Only bug fixes are allowed.
1. Release branches are never deleted.
1. Any hotfixes for the release branch are merged into the release branch and then cherry-picked into the `develop` branch if necessary.

```plaintext
# Example of branching strategy
/develop  ->      /2.1.0       ->  #patch-commit
          ->  #feature-commit  ->  #patch-commit (cherry-picked)  -> /2.2.0
                                                                  -> ...
```

## Release Flow

1. Prepare a release candidate (alpha).
1. Deliver the alpha to QA.
1. QA tests the alpha.
1. If QA finds issues, a github issue is created and moved to the `Sprint` column. Any fixes are merged into the release branch and `develop` branch.
1. If QA finds no issues, the release is approved.
1. A production release is built.
1. QA tests the production release.
1. Production release is published.

## Checklist Before Alpha Release

- [ ] Release branch is created from `develop` branch with the production version number, e.g. `2.1.0`. (Choose version number based on [semantic versioning](https://semver.org/) and our [last release](https://github.com/TryQuiet/quiet/releases).)
- [ ] Review the base `CHANGELOG.md` file (Package level `CHANGELOG.md` files are automatically updated during the release process) and ensured that it is up to date with all changes included in the release since the last production release and update the version number.
- [ ] Review the [Quiet Planning Board](https://github.com/orgs/TryQuiet/projects/3) and ensured all issues contained in the release candidate are in the `Ready for QA` column.
- [ ] The QSS revision required by this Quiet alpha is deployed to its configured staging endpoint, and community creation, joining, and message delivery have been verified with the alpha client.

## Preparing a Release Candidate (Alpha)

Alpha releases are pre-release versions of the release which are delivered to QA for testing. They are versioned with a pre-release version number, e.g. `2.1.0-alpha.0`.

1. Generate a [Github Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#) and set it as `GH_TOKEN` environment variable (or include it in the command as shown below).
1. Update Tor binaries: `./scripts/update-tor-binaries-desktop.sh` (updates both desktop and Android but not iOS. TODO: streamline updating Tor on iOS)
1. Complete the [QSS staging deployment](#preparing-a-qss-alpha-staging) for this client release before publishing the Quiet alpha.
1. Trigger a pre-release with `GH_TOKEN=<token> npm run publish --release=[prepatch|preminor|premajor|<EXACT_VERSION>]` (e.g. to create a prerelease of a minor update `npm run publish --release=preminor`) This will increment the versions of every package that has changed, create a release on the [Releases Page](https://github.com/TryQuiet/quiet/releases), and trigger Github Actions to deploy the alpha release to the Google Play Store and App Store.
1. Manually update the release notes on the [Releases Page](https://github.com/TryQuiet/quiet/releases) with the changes included in the alpha release. See [RELEASE_NOTES_GUIDE.md](RELEASE_NOTES_GUIDE.md) for guidance on writing release notes.
1. Promote the alpha release on the [Google Play Console](https://play.google.com/console/) to a closed testing track. Contact @holmesworcester if you need access to the organization.
1. Notify QA that the alpha release is ready for testing.

## Publishing QSS

QSS is released separately in [TryQuiet/quiet-storage-service](https://github.com/TryQuiet/quiet-storage-service), with its own version numbers. Publishing a Quiet client release does not deploy QSS. QSS deployments are triggered by GitHub releases in the QSS repository.

### Setting Up the QSS Release Checkout

1. Select the QSS revision pinned by the intended Quiet release's `3rd-party/qss` submodule. For example, Quiet `9.0.2` pins QSS commit `78cfa2ca22e605dfdfdd23265af90ce1976b430f`, on QSS branch `release/9.0.0`. QSS's release version is separate from the Quiet client version.
1. Clone the QSS repository and check out that branch. The following commands use the Quiet `9.0.2` example:

   ```bash
   git clone --branch release/9.0.0 --recurse-submodules \
     https://github.com/TryQuiet/quiet-storage-service.git qss-release
   cd qss-release
   ```

   If the repository is already cloned, run these commands from its directory instead:

   ```bash
   git switch release/9.0.0
   git submodule update --init --recursive
   ```

   Do not add `--remote`: the release must use its pinned submodule commits.
1. Check the required versions in the QSS checkout's `package.json`. This example requires Node `22.14.0`, npm `10.9.2`, and pnpm `10.6.0`. Select the required Node version with your Node version manager, then install the matching tools using npm:

   ```bash
   npm install --global npm@10.9.2 pnpm@10.6.0
   hash -r
   node --version
   npm --version
   pnpm --version
   ```

   `ERR_PNPM_UNSUPPORTED_ENGINE` means the active tool version does not match the checkout. If `pnpm i -g pnpm` reports `ERR_PNPM_NO_GLOBAL_BIN_DIR`, use the npm command above; it does not depend on pnpm's global directory. If another pnpm installation still takes precedence in `PATH`, the explicit-version command below runs the bootstrap with pnpm `10.6.0`, including its nested pnpm commands, without a global installation:

   ```bash
   npm exec --yes --package=pnpm@10.6.0 -- pnpm run bootstrap -vmc
   ```

1. With the matching pnpm version active, install dependencies and build:

   ```bash
   pnpm run bootstrap -vmc
   git status --short
   ```

   The bootstrap flags enable verbose output, skip pulling newer submodule commits, and copy the pinned auth packages into the build workspace. If the explicit-version bootstrap above already succeeded, do not repeat it. Verify the tests and build, review any working-tree changes, and start publishing from a clean checkout.
1. Authenticate Git and the GitHub CLI with credentials that can push the release commit and tag and create a GitHub release. A token that can only push a branch is insufficient. The commands below obtain `GH_TOKEN` from the current `gh` login. Choose an unused QSS version; the versions shown are examples.

   In this checkout, Lerna's `allowBranch: ["*"]` does not match branch names containing `/`. Publishing from `release/9.0.0` therefore fails with `ENOTALLOWED` before changing versions. The commands below explicitly allow that release branch with `--allow-branch release/9.0.0`. When publishing another approved branch, replace this argument with its exact name after checking `git branch --show-current`.

   If the global pnpm version is still incorrect, use the same explicit-version wrapper when publishing. For example, the full-release command becomes:

   ```bash
   GH_TOKEN="$(gh auth token)" npm exec --yes --package=pnpm@10.6.0 -- \
     pnpm run publish 2.0.0 --allow-branch release/9.0.0
   ```

### Preparing a QSS Alpha (Staging)

1. Complete the QSS checkout setup above and prepare the release notes.
1. Publish a QSS **prerelease** using the existing `publish` script:

   ```bash
   GH_TOKEN="$(gh auth token)" pnpm run publish 2.0.0-alpha.0 --allow-branch release/9.0.0
   ```

   Review and accept Lerna's version confirmation. The script commits the version changes, pushes the tag, and creates the GitHub release. The [development deployment workflow](https://github.com/TryQuiet/quiet-storage-service/blob/main/.github/workflows/deploy_dev.yml) deploys to staging (`wss://qss-dev.quiet-services.app`) on `prereleased` and `released` events. Verify that **Deploy to EC2 (Development)** starts for the intended tag and commit. Publishing a prerelease from a draft does not trigger this workflow; see [GitHub's release event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release).
1. Wait for the workflow and AWS CodeDeploy to succeed. Deployment builds QSS, runs the staging database migrations, and starts or restarts the service.
1. Record the deployed version and commit. Verify community creation, joining, and message delivery against staging, then notify QA that the QSS alpha is ready for testing.

### Preparing a QSS Production Release

1. Obtain production release approval after QA has tested the QSS alpha. Review the database migrations before deploying.
1. From the prepared QSS checkout, publish a **full release**, for example:

   ```bash
   GH_TOKEN="$(gh auth token)" pnpm run publish 2.0.0 --allow-branch release/9.0.0
   ```

   Review and accept Lerna's version confirmation. The [production deployment workflow](https://github.com/TryQuiet/quiet-storage-service/blob/main/.github/workflows/deploy_prod.yml) deploys on the `released` event. This event also triggers the development workflow, so a full release deploys to **both production and staging**. The checked-in release workflows do not provide a production-only manual trigger. To update only production, use a separately prepared manual workflow based on `deploy_prod.yml`, with `environment: production` and `CODE_DEPLOY_GROUP_NAME_PROD`.
1. Watch **Deploy to EC2 (Production)** and **Deploy to EC2 (Development)** in [QSS Actions](https://github.com/TryQuiet/quiet-storage-service/actions). The existing deployment action builds QSS, uploads the release bundle to S3, invokes AWS CodeDeploy, and waits for CodeDeploy to succeed. Each deployment runs its environment's database migrations and starts or restarts the service.
1. Record the deployed version and commit, including deployments performed manually. Check production health:

   ```bash
   curl -fsS https://qss-prod.quiet-services.app/health
   ```

   Verify community creation, joining, and fresh message delivery with the intended Quiet clients against `wss://qss-prod.quiet-services.app`. Include delivery with Tor disabled so a Tor connection cannot hide a failed QSS deployment. A successful health check alone does not verify these operations.

## Checklist Before Production Release

- [ ] Build is working correctly, passes automated tests and self-QA
- [ ] Alpha was delivered for QA
- [ ] Sprint column is free from QA reported blocking issues
- [ ] QA approved the release
- [ ] The QSS revision required by this Quiet release is deployed to production, and community creation, joining, and message delivery through QSS have been verified with the release client before publishing Quiet.
- [ ] All hotfixes for issues discovered in alpha releases have been merged into the release (and develop) branch
- [ ] CHANGELOG.md is up to date and approved by @holmesworcester
- [ ] PM approved the release

## Preparing a Production Release

1. If not already done, generate a [Github Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#) and set it as `GH_TOKEN` environment variable (or include it in the command as shown below).
1. Complete the [QSS production deployment](#preparing-a-qss-production-release) for this client release before publishing Quiet.
1. Trigger a production release with `GH_TOKEN=<token> npm run publish --release=[patch|minor|major|<EXACT_VERSION>]` (e.g. to create a prerelease of a minor update `npm run publish --release=minor`) This should remove the `alpha.x` suffix, and create a release on the [Releases Page](https://github.com/TryQuiet/quiet/releases), and trigger Github Actions to deploy the release to the Google Play Store and App Store. If the semantic version is different from the alpha release, select no in the prompt to create new versions, and call the command again with the exact version.
1. Manually update the release notes on the [Releases Page](https://github.com/TryQuiet/quiet/releases) with the changes included in the release. See [RELEASE_NOTES_GUIDE.md](RELEASE_NOTES_GUIDE.md) for guidance on writing release notes.
1. Promote the release on the [Google Play Console](https://play.google.com/console/) to a production track.
1. Promote the release on the [App Store Connect](https://appstoreconnect.apple.com/). If the new version has Approved status on the ios console but users see "This beta isn't accepting any new testers right now." please follow those instructions: [Resolving error](https://help.playtestcloud.com/en/articles/6824982-resolving-the-this-beta-isn-t-accepting-any-new-testers-right-now-error).
1. Checkout the `gh-pages` branch, and create a PR ([example](https://github.com/TryQuiet/quiet/pull/2605)) to update the download links on the [Quiet website](https://tryquiet.org/#Downloads) to point to the new release.

## Post-release checklist (production)

- [ ] Release branch with any fixes is moved back to develop and any conflicts are resolved
- [ ] Release build completed successfully and the assets are uploaded to the release page
- [ ] Download links are updated on website
- [ ] App is promoted and sent for review on a production track in Google Play
- [ ] App is promoted and sent for review on an external track in App Store (Test Flight) **Note:** this is a separate step *after* the builds become visible in TestFlight!!
- [ ] Issues in `Ready for QA` are moved to `Done`

## QA

QA tests for issues on all the supported platforms, moves discovered blocking issues into the Sprint column, and notifies the team in the Slack **#qa** channel.

QA will test according to the following checklists:
[Quiet Desktop Checklist](https://docs.google.com/spreadsheets/d/1QL5wKFbGMfGK5tZOr0YmeRGk5noS1Beo/edit?usp=sharing&ouid=106345980764925230240&rtpof=true&sd=true)
[Quiet Mobile Checklist](https://docs.google.com/spreadsheets/d/1fwnTQKux7UUJtyjJwm9ENHGvbR_bv5gZ/edit?usp=sharing&ouid=106345980764925230240&rtpof=true&sd=true)
[Quiet Prod Checklist](https://docs.google.com/spreadsheets/d/1qXo6FnED_Js7e-pfVG-ZNrJvztYkRNlK/edit?usp=sharing&ouid=106345980764925230240&rtpof=true&sd=true)

### Rules for QA and Release Approval

1. Team drops any other work to work on new issues blocking release
2. PM can asynchronously decide a bug is not a blocker
3. Team and QA can consult PM if they suspect a bug is not really a blocker despite meeting criteria
4. PM can approve release in advance, pending completion of issues, or wait to give approval

## Breaking changes

While Quiet is in its early stages and does not have known communities of active users, we have the luxury of releasing breaking changes, e.g. changes that require users to start a new community. However, we still take some reasonable steps to make breaking changes comfortable for users.
While Quiet is in its early stages and does not have known communities of active users, we have the luxury of releasing breaking changes, e.g. changes that require users to start a new community. However, we still take some reasonable steps to make breaking changes comfortable for users.

1. Update storage location on Desktop (see: https://github.com/TryQuiet/quiet/pull/2829) and Mobile (see: https://github.com/TryQuiet/quiet/pull/2831/files).
2. Create a new S3 bucket for the new major release (the new release will fail without this step)
3. Once the new release is available for download on our website, push a final release of the previous major branch with a notice to desktop users (e.g: https://github.com/TryQuiet/quiet/pull/2827)
2. Do not automatically update iOS users. Instead, create a new release branch in TestFlight such that users must update manually. See: https://github.com/TryQuiet/quiet/issues/1980
3. On Android, we currently have no great way to avoid automatic updates. In this case, decide whether to show a message a few days or weeks in advance, or not. See: https://github.com/TryQuiet/quiet/issues/1980#issuecomment-1795028313
