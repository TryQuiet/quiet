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
- [ ] QSS on the alpha's configured endpoint supports this client release. Complete the QSS compatibility checks below before delivering the alpha to QA.

## Preparing a Release Candidate (Alpha)

Alpha releases are pre-release versions of the release which are delivered to QA for testing. They are versioned with a pre-release version number, e.g. `2.1.0-alpha.0`.

1. Generate a [Github Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#) and set it as `GH_TOKEN` environment variable (or include it in the command as shown below).
1. Update Tor binaries: `./scripts/update-tor-binaries-desktop.sh` (updates both desktop and Android but not iOS. TODO: streamline updating Tor on iOS)
1. Trigger a pre-release with `GH_TOKEN=<token> npm run publish --release=[prepatch|preminor|premajor|<EXACT_VERSION>]` (e.g. to create a prerelease of a minor update `npm run publish --release=preminor`) This will increment the versions of every package that has changed, create a release on the [Releases Page](https://github.com/TryQuiet/quiet/releases), and trigger Github Actions to deploy the alpha release to the Google Play Store and App Store.
1. Manually update the release notes on the [Releases Page](https://github.com/TryQuiet/quiet/releases) with the changes included in the alpha release. See [RELEASE_NOTES_GUIDE.md](RELEASE_NOTES_GUIDE.md) for guidance on writing release notes.
1. Promote the alpha release on the [Google Play Console](https://play.google.com/console/) to a closed testing track. Contact @holmesworcester if you need access to the organization.
1. Notify QA that the alpha release is ready for testing.

## Publishing QSS

QSS is released separately from Quiet in [TryQuiet/quiet-storage-service](https://github.com/TryQuiet/quiet-storage-service). Publishing a Quiet alpha does not deploy QSS. QSS has its own version numbers; choose a compatible QSS revision rather than matching the Quiet version number.

1. Record the Quiet release commit, its `3rd-party/auth` and `3rd-party/qss` commits, and QSS's nested `3rd-party/auth` commit. Initialize submodules recursively. Check the auth connection protocol on both sides: Quiet `10.0.0-alpha.0` requires protocol 4, while `9.0.2` uses protocol 3. A protocol mismatch causes `PROTOCOL_VERSION_UNSUPPORTED` even when the socket connects and CAPTCHA succeeds. See the [physical iOS comparison](scripts/connection-regression/reports/ios-qss-2026-09-14.md).
1. Confirm the QSS endpoint in the built client, including any endpoint carried by an invitation. The published iOS `10.0.0-alpha.0` uses `wss://qss-dev.quiet-services.app` (staging). Check each platform's build configuration before publishing.
1. Test the intended QSS commit with real clients before deployment. Create a community, join from a second device, and exchange fresh messages in both directions. Also send while the recipient is stopped, verify server storage, stop the sender, and launch the recipient to verify delivery through QSS. Include physical iOS and Android devices. A health check or successful socket connection is insufficient.
1. In the QSS repository, prepare the release version and notes, and verify its tests and build. Review the database migrations and the effect on existing communities and supported client versions before selecting a deployment target. Protocol 3 and protocol 4 clients require compatible servers; test the client upgrade and community migration plan before production.
1. For staging, publish a QSS **prerelease**. The [development deployment workflow](https://github.com/TryQuiet/quiet-storage-service/blob/main/.github/workflows/deploy_dev.yml) listens for `prereleased` and `released` events. Verify that **Deploy to EC2 (Development)** starts for the intended tag and commit. With these triggers, publishing a prerelease from a draft does not start the workflow; see [GitHub's release event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release).
1. Wait for the deployment workflow and AWS CodeDeploy to succeed. The deployment builds QSS, runs the selected environment's database migrations, and starts or restarts the service. Record the deployed commit and repeat the client authentication, joining, and stored-message checks against the deployed staging endpoint before notifying QA.
1. After production release approval, publish or promote a QSS **full release**. The [production deployment workflow](https://github.com/TryQuiet/quiet-storage-service/blob/main/.github/workflows/deploy_prod.yml) listens for `released`; this event also deploys to staging. A full release therefore changes **both environments**. Verify both deployment runs and repeat the production client checks.

## Checklist Before Production Release

- [ ] Build is working correctly, passes automated tests and self-QA
- [ ] Alpha was delivered for QA
- [ ] Sprint column is free from QA reported blocking issues
- [ ] QA approved the release
- [ ] All hotfixes for issues discovered in alpha releases have been merged into the release (and develop) branch
- [ ] CHANGELOG.md is up to date and approved by @holmesworcester
- [ ] PM approved the release
- [ ] QSS compatibility, deployment, and client checks above are complete for the production endpoint and supported client versions.

## Preparing a Production Release

1. If not already done, generate a [Github Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#) and set it as `GH_TOKEN` environment variable (or include it in the command as shown below).
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
