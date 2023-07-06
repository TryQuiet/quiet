# Quiet Mobile

Quiet Mobile is a React Native app for Android and iOS that shares a Node.js [backend](https://github.com/TryQuiet/monorepo/tree/master/packages/backend) and a JavaScript/Redux [state manager](https://github.com/TryQuiet/monorepo/tree/master/packages/state-manager) with [Quiet Desktop](https://github.com/TryQuiet/monorepo/tree/master/packages/desktop).

## Setting up Android environment

### Prerequisites

In the root directory of `quiet/`, install the monorepo's dependencies and bootstrap the project with lerna. It will take care of the package's dependencies and trigger a prepublish script which builds them.

```
npm install
npm run lerna bootstrap
```

On your host, install adb, https://developer.android.com/studio/command-line/adb.

On your phone in the Developer Options, enable USB debugging (check carefully for security options as they may appear besides the standard debugging ones) and enable installing applications through USB on your physical device (https://developer.android.com/studio/debug/dev-options) and plug in your phone via USB cable.

### Docker container

Docker container with Android development environment can be found in `packages/mobile/android-environment`.

Build the image,

```
docker build -t quiet-mobile-dev -f Dockerfile .
```

Then start a container and attach to it,

```
docker run -it --rm --name quiet-mobile-debug -u node --network host --entrypoint bash --privileged -v /dev/bus/usb:/dev/bus/usb -v /<path-to-monorepo>:/app quiet-mobile-dev
```

Once attached to the container, start Metro, a JavaScript bundler for React Native,

```
npm run start
```

Open another terminal window and start building the application,

```
docker exec -it quiet-mobile-debug /usr/local/bin/npm run android
```

### Wireless debugging (optional)

**These instructions are included for convenience and may help if you're having a problem with wired debugging. Be mindful of your local network when using this option.**

To connect your debugging device wirelessly, make sure it runs on Android 11 or above.  Enable wireless debugging in the Developer Options and plug it in to your machine via USB.

Open a terminal window and tell the adb daemon to use port 5555,

```
adb tcpip 5555
```

Then check your phone's IP address and connect to it

```
adb connect <phone-ip>:5555
```

Unplug your phone and repeat the last command in the Docker container section to build the application with the new port.

### Access Android application logs

Open a terminal window,

```
adb logcat --pid=$(adb shell pidof -s com.quietmobile.debug)
```

### Locally linking packages (mobile) (optional)

Metro requires additional step for locally linking packages. After running standard `npm link` commands, update `metro.config.js` as follows

```
const watchFolders = [
  ...
  path.resolve(__dirname, '<path-to-linked-package>')
]
```

## Running E2E tests (optional)
We use Detox (https://wix.github.io/Detox/) for E2E testing on mobile.  
Detox recommends to install its `detox-cli` globally, enabling usage of the command line tools outside npm scripts.

```
npm install detox-cli --global
```

> NOTE: From this point, we recommend to operate within a docker container provided for Android development (unless you have an environment already set up locally)

Choose proper configuration depending on the os and target device and pass it with `-configuration` flag when building and running tests.
(The configuration has a following pattern: `<OS>.<DEVICE-TYPE>.<BUILD-TYPE>`, eg. for ios debug simulator use `ios.sim.debug` and for android release tested on an attached device use `android.att.release`)

There're two commands to use:
(remember to prefix commands with `npx` if using globally installed `detox-cli`)

The first one for building binary file to put under test:  

```
detox build --configuration android.att.debug
```

And the second one for actually running the tests:
(let's trigger the basic set of e2e tests called `starter`)

```
detox test starter --configuration android.att.debug
```

For more detailed instructions, see https://wix.github.io/Detox/docs/introduction/your-first-test/

## Running visual regression tests

> NOTE: See the building instructions in the previous section

There's a flag for enabling screenshot comparison during e2e tests `-enable-visual-regression`.

In order to perform comparision, the presence of a base screenshots is required under `e2e/visual-regressions/<ENVIRONMENT>/<PLATFORM>/<TEST>-base-screenshots` (where `<ENVIRONMENT>` can be either `local` or `ci`). The easiest way to generate them is to go through the test using `-base-update` flag.

> NOTE: Actual base snapshots hosted in the repo were generated with iPhone 14 simulator and serves as a baselines for automated runs

There're two types of tests: a basic (starter) set of e2e tests, and an app-wide visual regression test which uses storybook.
For the second type, it's important to use a `storybook` variant of the build

```
detox test storybook --configuration android.att.storybook -- -enable-visual-regression
```

Tests can also be started at a particular story pointed out using `-starting-story=<STORY-NAME>` flag.

## Development hints

React-native projects consists of two parts: javascript code and native code. Native code lives within the `/android` and `/ios` folder.  

### IDE

If you only wish to make changes to the react-native part of the project, simply use your favorite code editor.
Altough if you plan to modify the native code, Android Studio is recommended as it simplifies things a lot and Xcode is required to be able to work with iOS.


### When to rebuild the project?

Both Android and iOS manages their own dependencies with the help of `gradle` (Android) and `cocoapods` (iOS). They work similar to `npm`.  
Whenewer there're changes to the dependencies in the native projects (`build.gradle` or `podfile`) there's a need to sync gradle files (it's fairly easy to do with Android Studio) or to run `pod install` command from the `/ios` directory. It doesn't happen very often but may be a case while attaching react-native modules getting use of the native methods (eg. for file management).

If changes are made to the native part of the project (java, kotlin, objc or swift) it's neccessary to rebuild the project (`npm run android`, `npm run ios`)

React-native uses a tool called metro to bundle javascript files. It does it on runtime, before processing react-native code. Depending on the size of cached files it may take several seconds to fully load the bundled js code. When a change is made to the javascript codebase, it's usually enough to reload files with metro, by pressing `R` from within the console in which metro operates.

### The app is stuck on splash screen

Sometimes metro loader takes long enough to cause a race condition failure with the native service notifying javascript code about the data of websocket server 
we use to communicate with backend. In this case, we should be able to observe a log informing us that an event has been emitted but there was nothing to receive it:
```
WEBSOCKET CONNECTION: Starting on 11000
RCTNativeAppEventEmitter: Tried to send an event but got NULL on reactContext
```
The easiest solution is to close the app and open it again by tapping it's icon on the device (there's no need to rebuild the project) (Android/iOS)  
or to follow `Product -> Perform Action -> Run Without Building` in Xcode. (iOS)

If it's not enough, you can locally increase the `WEBSOCKET_CONNECTION_DELAY` for emitting the event at `mobile/android/app/src/main/java/com/quietmobile/Utils/Const.kt` (Android)


## Troubleshooting

### Could not set file mode 644 on

Gradle copies the dependencies of nested nodejs project. It may encounter problems with access rights. To solve that make sure, you run docker container as file's owner (`-u` flag). node user has uid 1000 - make sure it's the same as owner's uid. You can pass (numeric) uid instead of user name when running docker container.

### Can't find file to patch at input line 3

Mobile package uses several patches for external dependencies. If you encounter problems with applying those patches because of missing target file, you'll be prompted to provide the path. Use absolute (local) path to the file, eg. `usr/linux/quiet/packages/state-manager/node_modules/factory-girl/package.json`.

### Invalid symlink at

Built app bundle cannot contain symlinks linking outside the package (which sometimes happens when symlink uses absolute path). In this case one needs to change the symlink to relative path. It can be achieved by adding a custom built task either in Gradle or Xcode. 

### Unable to resolve module

Usage of native methods (like the ones for file management) must be adapted for mobile environment. There're several ways to fix the issue with incompatible packages/files:
1. Shim packages with `rn-dodeify` https://www.npmjs.com/package/rn-nodeify
2. Blacklist certain files in `metro.config.js:30`
3. Use diff & patch https://www.freecodecamp.org/news/compare-files-with-diff-in-linux/
