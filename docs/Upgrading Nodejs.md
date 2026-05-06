# Upgrading to new Versions of NodeJS 

1. `.nvmrc` 

The .nvmrc file in the root of the project specifies the node verison that is used. Update this file to the newest version of Node, which will automatically update the node version used by the GitHub action CI scripts found in the `./github` directory. 

With [`nvm` installed](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) run:

```bash
nvm install # installs the latest nvm on your machine if it's not present 
nvm use # set it as the default node version 
```

You should see output like this:

```
Now using Node v20.20.0 (npm 10.8.2) ~/.local/share/nvm/v20.20.0/bin/node
```

The `node` version is the version specified in `.nvmrc`, make note of the corresponding `npm` verison, in this case `10.8.2`.

2. Updating `package.json`

In the root `package.json` update the `engine` and `volta` with the `node` version you specified and the `npm` version from above:

```json
 "engines": {
    "node": "20.20.0",
    "npm": "10.8.2"
  }
```

```json
  "volta": {
    "node": "20.20.0",
    "npm": "10.8.2"
  }
```

3. Readme Documentation 

Update `packages/desktop/README.md` and `packages/mobile/README.md` and any other documentation with your new `node` version.

4. Android Docker File 

Open https://hub.docker.com/layers/library/node/20.20.0/ with your node verison. Copy and paste the "Index Digest" text strating with `sha256:`

Then edit `pacakges/mobile/android-environment/Dockerfile`

```Dockerfile
FROM node:20.20.0@sha256:65b74d0fb42134c49530a8c34e9f3e4a2fb8e1f99ac4a0eb4e6f314b426183a2
```

- Change the `node` version to the new version
- After the `@` sign update the digest with the value copied above from the webpage

5. If necessary, to support the new version, obtain new `classic-level` binaries for each platofrm + architecture that are linked against the new nodejs version. This will be needed if there are brekaing changes to the `n-api` the "node API" used for npm modules with native code in your new nodejs release. `classic-level` might have to be recompiled by hand. Update: 

- `packages/backend-bundle/deps/darwin/universal/classic-level/classic-level.node` (NOTE that this is a ["Mach-O FAT binary"](https://en.wikipedia.org/wiki/Fat_binary#Mach-O_and_Mac_OS_X) containing executable code for macOS that can is capable of running on **both** ARM and Intel macs)
- `packages/backend-bundle/deps/linux/x64/classic-level/classic_level.node` for Intel based Linux machines 
- `packages/backend-bundle/depswin32/x64/classic-level/classic_level.node` for Intel based Windows machines. *As of this writing Quiet doesn't support ARM based Windows PCs...*
- `packages/mobile/nodejs-assets/deps/android/arm64/classic-level/classic_level.node` This is the binary for Android devices with 64 bit ARM processors. It won't work on older 32 bit Android ARM processors, aka devices wiht the `armeabi-v7a` ABI which are still found in the wild. It won't work in android emulators that are running on Intel based hosts, but can run fine on emulators with a 64 bit ARM (such as newer Apple Silicon macs). In order to be submitted in the play store this binary needs to be 16-bit aligned, which happens automatically when you compile it with Android NDK versions 28 and higher. 
- `packages/mobile/nodejs-assets/deps/ios/universal/classic-level/classic_level.node` This is the iOS binary. It's also technically a Mach-O FAT binary, but currently only supports one architecture which is the `arm64` one for physical iPhones, but in theory there should be a binary (either seperately or as a FAT binary) supporting the `arm64-simulator` architecture which will let you run Quiet in the iPhone simulator on Apple Silicon macs... 
- `cp -f` the new `packages/mobile/nodejs-assets/deps/ios/universal/classic-level/classic_level.node` from the last step to `packages/mobile/ios/classic-level.framework/classic-level` (overwrite the file here with the `.node` file from the last step but **don't** include the file extension...)

See `packages/mobile/docs/building-classic-level-android.md` for help on recompiling `classic-level` against the headers in nodejs mobile. 


6. Update the nodejs backend on iOS and Android, if necessary. **This is different from the version of nodejs that react native uses.** This version of nodejs is used to run custom nodejs modules on these platforms, it's what's used to run the `classic-level` binary. This only should happen if you had to do the last step...

*comming soon...*

6. Update `node` command line flags, if necessary

New versions of add/remove command line flags. If you need to make this change update: 

- the various tests in `packages/backend/package.json`
- `packages/desktop/src/main/main.ts` for the Desktop electron app 
- If you had to update the mobile dependencies for `classic-level` in steps 5 and 6, then also update:
	- Update the args in `pacakges/mobile/android/app/src/main/java/com/quietmobile/Backend/BackendWorker.kt`'s `fun` `startNodeProjectWithArguments`
	- `packages/mobile/ios/NodeJsMobile/RNNodeJsMobile.m`'s `-(void)callStartNodeProject:(NSString *)input`. Note that on iOS this is defined in the variable `nodeArguements` twice:


```m
  NSString* dlopenoverridePath = [[NSBundle mainBundle] pathForResource:[NSString stringWithFormat:@"%@/%@", NODEJS_PROJECT_RESOURCE_PATH, NODEJS_DLOPEN_OVERRIDE_FILENAME] ofType:@""];

  // Check if the file to override dlopen lookup exists, for loading native modules from the Frameworks.
  if(!dlopenoverridePath)
  {
    nodeArguments = [NSMutableArray arrayWithObjects:
                              @"node",
                              @"--experimental-global-customevent",
                              srcPath,
                              nil
                    ];

    [nodeArguments addObjectsFromArray:args];
  } else {
    nodeArguments = [NSMutableArray arrayWithObjects:
                              @"node",
                              @"--experimental-global-customevent",
                              @"-r",
                              dlopenoverridePath,
                              srcPath,
                              nil
                    ];

    [nodeArguments addObjectsFromArray:args];
```
7. Update `electron`

Migrate `packages/desktop/package.json` to an electron version that ships with the new node verison. 

- You can see each major electron release's nodejs [here](https://releases.electronjs.org/release?channel=stable)
- Pay careful attention to breaking changes within electron releases. APIs can be removed which will make your project fail to build. But also, and more subtly, the behavior of a certain API may change causing Quiet to build and perhaps seem OK, but something is now behaving differently and/or incorrectly.
- Upgrade the `selenium-webdriver` and the `electron-chromedriver` modules in `packages/e2e-tests/package.json`. `electron-chromedriver` should match the major version of `electron` that you just migrated to in the `desktop` package.

8. Bootsrap

Run `npm run bootstrap` and fix whatever just got broken with the new `node` version. 

