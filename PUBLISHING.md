<p>
  <h1 align="center">
    <b>Publishing instruction for the core team developers.</b>
  </h1>

  <h3 align="center">
    Current release owner 🎉⛸️🦆 <a href='https://github.com/leblowl'>@leblowl</a> (February 2024)
  </h3>

  <br />
  <br />
</p>

## Trigger
Release process begins when all issues from `Sprint` are merged and moved to `Ready for QA`.  

## Branching strategy
Each release starts with it's own branch (based on develop).
Develop becomes a draft for the next release.
From this moment, all the fixes (patches) for the last supported version are being merged into the release branch and cherry-picked into develop.

### Example:
```
/develop  ->      /2.1.0       ->  #patch-commit
          ->  #feature-commit  ->  #patch-commit (cherry-picked)  -> /2.2.0
                                                                  -> ...
```


## Release candidates (alpha releases)
Pre-release builds should only be triggered from the release branch and then delivered to QA.  
If QA reports problems that needs to be solved, the fixes must be merged into the release and develop branches, then a patched pre-release is to be built.


## Pre-release checklist
- [ ] Build is working correctly, passes automated tests and self-QA
- [ ] Release candidate is delivered for QA
- [ ] Sprint column is free from QA reported blocking issues
- [ ] QA approved the release
- [ ] All hotfixes to previous releases have been merged into the release (and develop) branch
- [ ] CHANGELOG.md is up to date
- [ ] PM approved the release


## Publishing instruction

By the time release is ready, ask @holmes for <b>CHANGELOG.md</b> cosmetic review, then:
1. Checkout to a branch named after the release version number
2. Navigate to root project directory
3. Update CHANGELOG.md file
4. Use the following command (with proper release type !For alpha releases use `pre` prefix!):  
  `npm run publish --release=[patch|minor|major|EXACT_VERSION]`
5. Cherry-pick `Publish` and `Update packages CHANGELOG.md` commits into /develop
6. Manually update release notes on the <a href='https://github.com/TryQuiet/quiet/releases' target='blank'>Releases Page</a>

## Post-release checklist (alpha)
- [ ] App is promoted and sent for review on a closed testing track in Google Play

## Post-release checklist (production)
- [ ] Download links are updated on a website and in README.md
- [ ] App is promoted and sent for review on a production track in Google Play
- [ ] App is promoted and sent for review on an external track in App Store (Test Flight)


## Changelog / Releases Page
Root <b>CHANGELOG.md</b> file contents are being copied into each packages' ones.  
This process is automated by `copy-changelog.js` script hooked on `postpublish` action.


## QA
QA tests for issues on all the supported platforms and moves discovered blocking issues intoto the Sprint column, then mentions them in Slack <b>#qa</b> channel, following the criteria:  
- regression,
- new bug that creates a general feeling of unreliability,
- issue that is incompletely implemented according to the issue description,

### Book of laws
1. Team drops any other work to work on new issues in the Sprint column
2. PM can asynchronously decide a bug is not a blocker
3. Team and QA can consult PM if they suspect a bug is not really a blocker despite meeting criteria
4. PM can approve release in advance, pending completion of issues, or wait to give approval


#### (TODO) Publishing Process Document
1. Expand on post-release checklist





