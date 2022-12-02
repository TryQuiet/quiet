# Quiet Desktop

Running the desktop version of Quiet should be straightforward on Mac, Windows, and Linux. Here are the steps:

0. Use Node 16.14.0 and npm 8.4
1. In `quiet/` install monorepo's dependencies and bootstrap the project with lerna. It will take care of the package's dependencies and trigger a prepublish script which builds them.

```
npm install
npm run lerna bootstrap
```

2. In `quiet/packages/desktop` run: 

```
npm run start
```

If building on an M1 Mac:
1. Install [fnm](https://github.com/Schniz/fnm) 
2. Run `fnm use 16.14`
3. Run `fnm install 16.14 --arch x64`
4. Follow the instructions here to run leveldown packages for the M1 architecture: https://github.com/orbitdb/orbit-db/issues/1019#issuecomment-1324219877

----

## Versioning packages

Before trying to release a new version, make sure you have GH_TOKEN env set.

The project uses independent versioning which means each package has its own version number. Only those packages in which something has changed since the last release will be bumped.

To create a release run:

```
lerna version <release-type>
```

To build a test version with Sentry, run:

```
lerna version prerelease
```

----

## Handy tips

To run multiple instances of Quiet for testing, run from the command line with the environment variable `DATA_DIR="<directory name>". 

Use lerna to install additional npm packages

```
lerna add <npm-package-name> [--dev] <path-to-monorepo-package>
```

For example, if you want to install luxon in state-manager, use the following command:

```
lerna add luxon packages/state-manager
```

----

Lerna takes care of all the packages. You can execute scripts is every pakcage by simpy running:

```
lerna run <script> --stream
```

To limit script execution to specific package, add scope to the command

```
lerna run <script> --stream --scope <package-name>
```

or multiple packages:

```
lerna run <script> --stream --scope '{<package-name-1>,<package-name-2>}'
```

Available package names are:
- @quiet/identity
- @quiet/state-manager
- @quiet/backend
- @quiet/logger
- e2e-tests
- integration-tests
- quiet (desktop)

----

## Locally linking packages (mobile)

Metro requires additional step for locally linking packages. After running standard ```npm link``` commands, update ```metro.config.js``` as follows

```
const watchFolders = [
  ...
  path.resolve(__dirname, '<path-to-linked-package>')
]
```
