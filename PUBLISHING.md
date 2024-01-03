<p>
  <h1 align="center">
    <b>Publishing instruction for the core team developers.</b>
  </h1>

  <br />
  <br />
</p>

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


## Publishing instruction

By the time release is ready, ask @holmes for <b>CHANGELOG.md</b> cosmetic review, then:
1. Checkout to a branch named after the release version number
1. Navigate to root project directory
2. Use the following command (with proper release type):  
  `npm run publish --release=[patch|minor|major]`

### Desktop:
Update download links on https://tryquiet.org/

### Android:
1. Open Google Play Developer Console
2. Promote newly uploaded version (internal track) to production


## Changelog / Releases Page
Root <b>CHANGELOG.md</b> file contents are being copied into each packages' ones.  
This way, <a href='https://github.com/TryQuiet/quiet/releases' target='blank'>Releases Page</a> remains a source of clearly presented information.  
This process is automated by `copy-changelog.js` script hooked on `postpublish` action.









