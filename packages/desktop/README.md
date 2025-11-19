# Quiet Desktop

Running the desktop version of Quiet should be straightforward on Mac and Linux. On Windows we recommend using git-bash or just wsl.
Here are the steps:

1. Linux users only: Install `patch` via your package manager

2. Install `mise` via your package manager or `mise`'s install script at https://mise.jdx.dev/getting-started.html

4. In `quiet/` (project's root) install monorepo's dependencies and bootstrap the project via `mise`. It will take care of the package's dependencies/submodules and trigger a prepublish script which builds them.

```bash
mise bootstrap
```

If you run into problems please double check if you have exact version Node and NPM as listed in point 1.

5. In project root run,

```
npm run start:desktop
```

----

## Versioning packages

Before trying to release a new version, make sure you have `GH_TOKEN` env set.

The project uses independent versioning which means each package has its own version number. Only those packages in which something has changed since the last release will be bumped.

To create a release run:

```
npm run lerna version <release-type>
```

To build a prerelease version, run:

```
npm run lerna version prerelease
```

----

## Updating Tor Binaries

Quiet uses Tor binaries that are bundled in the `3rd-party/tor/` directory for desktop and `packages/mobile/android/app/src/main/jniLibs/arm64-v8a/libtor.so` for Android. Use `./scripts/update-tor-binaries-desktop.sh` to update them for all platforms, or use `--desktop-only` or `--android-only` flags to update specific platforms.

----

## Logging

By default logs are output to the console and to files located in the application data directory (this location varies by OS).

_See the `node-common` README for a more detailed description of file logging in Quiet._

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

## Compiling Binaries Locally

If you need to compile the electron binary for local testing there are convenience methods for each OS.

### Mac

```
npm run distMac:local
```

This will build the Mac binary in the `/dist` directory without signing/notarization and does _not_ publish the binary.  This works for x64 and arm64 but note that the directory under `/dist` will vary based on architecture (x64 deploys under `/dist/mac` and arm64 deploys under `/dist/mac-arm64`).

### Linux

_TBD_

### Windows

_TBD_
