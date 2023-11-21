# Quiet Desktop

Running the desktop version of Quiet should be straightforward on Mac and Linux. On Windows we recommend using git-bash or just wsl.
Here are the steps:

0. Use `Node 18.12.1` and `npm 8.19.2`. We recommend [nvm](https://github.com/nvm-sh/nvm) for easily switching Node versions, and if this README gets out of date you can see the actual version used by CI [here](https://github.com/TryQuiet/quiet/blob/master/.github/actions/setup-env/action.yml). If you are using nvm, you can run `nvm use` in the project's root to switch to the correct version.
1. In `quiet/` (project's root) install monorepo's dependencies and bootstrap the project with lerna. It will take care of the package's dependencies and trigger a prepublish script which builds them.

```
//npm i lerna@7.3.0
//npm i typescript@4.9.3
npm i
npm run lerna bootstrap
```

If you run into problems please double check if you have exact version Node and NPM as listed in point 0.

2. In `quiet/packages/desktop` run:

```
npm run start
```
----

## Versioning packages

Before trying to release a new version, make sure you have `GH_TOKEN` env set.

The project uses independent versioning which means each package has its own version number. Only those packages in which something has changed since the last release will be bumped.

To create a release run:

```
npm run lerna version <release-type>
```

To build a test version with Sentry, run:

```
npm run lerna version prerelease
```

----

## Handy tips

To run multiple instances of Quiet for testing, run from the command line with the environment variable `DATA_DIR="<directory name>"`.

----

Use lerna to install additional npm packages

```
npm run lerna add <npm-package-name> [--dev] <path-to-monorepo-package>
```

For example, if you want to install luxon in state-manager, use the following command:

```
npm run lerna add luxon packages/state-manager
```

----

Lerna takes care of all the packages. You can execute scripts is every package by simply running:

```
npm run lerna run <script> --stream
```

To limit script execution to specific package, add scope to the command

```
npm run lerna run <script> --stream --scope <package-name>
```

or multiple packages:

```
npm run lerna run <script> --stream --scope '{<package-name-1>,<package-name-2>}'
```

Available package names are:
- @quiet/identity
- @quiet/state-manager
- @quiet/backend
- @quiet/mobile
- @quiet/logger
- @quiet/common
- @quiet/types
- e2e-tests
- integration-tests
- quiet (desktop)

----

## Locally linking packages (mobile)

Metro requires additional step for locally linking packages. After running standard `npm link` commands, update `metro.config.js` as follows

```
const watchFolders = [
  ...
  path.resolve(__dirname, '<path-to-linked-package>')
]
```
