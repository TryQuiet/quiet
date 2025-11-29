# Quiet Mobile

Quiet Mobile is a React Native app for Android and iOS that shares a Node.js [backend](https://github.com/TryQuiet/monorepo/tree/master/packages/backend) and a JavaScript/Redux [state manager](https://github.com/TryQuiet/monorepo/tree/master/packages/state-manager) with [Quiet Desktop](https://github.com/TryQuiet/monorepo/tree/master/packages/desktop).

### Prerequisites

1. Set up a development environment for Quiet Desktop using [these instructions](https://github.com/TryQuiet/quiet/blob/develop/packages/desktop/README.md) and confirm you can run it
1. If not on Mac (which comes preinstalled with `patch`), install `patch`, e.g. via your Linux package manager
1. Install python3 and setuptools (used by node-gyp) through your preferred method. 

## Android development

1. In the root directory of `quiet/`, install the monorepo's dependencies and bootstrap the project with lerna. It will take care of the package's dependencies and trigger a prepublish script which builds them.
1. Follow the instructions for running [Quiet Desktop](https://github.com/TryQuiet/monorepo/tree/master/packages/desktop) and confirm it runs
1. If not on Mac, which comes preinstalled with `patch`, install `patch` (e.g. via your Linux package manager).
1. Install python3 and setuptools (used by node-gyp) through your preferred method. 
1. Install the [Temurin 17 JDK](https://adoptium.net/temurin) for [Mac](https://adoptium.net/temurin/releases/?package=jdk&version=17&os=mac) (.pkg) or [Linux](https://adoptium.net/installation/linux/)
1. Set `JAVA_HOME` to the Temurin install location by adding a line to your `.bashrc` or `.zshrc`:  
    - Mac: `export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"`
    - Linux: `export JAVA_HOME="/usr/lib/jvm/temurin-17-jdk-amd64/`

    Alternatively, the easiest way to install The Temurin 17 JDK on Mac and Linux systems is to use [`SDKMAn`](https://sdkman.io/). This program is similar to `nvm` but for JDKs and allows you to easily install and switch between multiple JDKs on a single system.

    ```bash
    # downloads and installs SDKMAN
    curl -s "https://get.sdkman.io" | bash

    # downloads + installs + configures JAVA_HOME for Temurin JDK 17
    sdk install java 17.0.0-tem
    ``` 

1. Install [Android Studio](https://developer.android.com/studio), ensuring that all of the following items in the installation wizard are checked
    - Android SDK
    - Android SDK Platform
1. Point the $ANDROID_HOME environment variable in your `.bashrc` or `.zshrc` to your Android install
    You can find it here:
      - macOS: `~/Library/Android/sdk/`
      - Linux: `~/Android/Sdk/`

1. Ensure Android Studio's `platform-tools` directories are added to your `PATH`. 
    
    Your `.bashrc` or `.zshrc` should now include something like:
    ```bash
    export JAVA_HOME="/usr/lib/jvm/temurin-17-jdk-amd64/"
    export ANDROID_HOME=$HOME/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    ```

1. Confirm that the "Android 15 (VanillaIceCream)" SDK required by React Native has been installed (confusingly, it is also called "android-35" or [API level 35](https://apilevels.com/))

    ```bash
    ls $ANDROID_HOME/platforms
    ```
    You should see `android-35`. You may also need to select specific versions of the SDK or tools, but currently the default install is sufficient (see: [React Native setup instructions](https://reactnative.dev/docs/set-up-your-environment))

1. Enable [Developer options](https://developer.android.com/studio/debug/dev-options#enable) and [USB debugging](https://developer.android.com/studio/debug/dev-options#Enable-debugging) on your Android phone and restart it
1. Connect your phone to your dev machine via USB
1. On Linux, follow [these instructions](https://reactnative.dev/docs/running-on-device?platform=android&os=linux#2-plug-in-your-device-via-usb-2) for authorizing your phone as a USB device (skip this step on Mac)
1. Accept any "USB Debugging" prompt on your phone
1. Confirm you can run [adb](https://developer.android.com/studio/command-line/adb) (Android Debug Bridge, installed with Android Studio) and that it can connect to your phone
    
    ```bash
    adb devices
    ```
    You should see your phone under "List of Devices Attached". If you do not, try `adb kill-server` or restarting your phone and your dev machine. You device should not appear as "Unauthorized". If it does, make sure you have accepted any "USB Debugging" prompts on your device.

1. Run Quiet

    From the `packages/mobile` directory

    ```bash
    npm run android
    ```

    The application should now be running on your device.

1. On Mac, Metro will launch automatically in a new terminal window, but on Linux you may need a separate step

    From the `packages/mobile` directory
    
    ```bash
    npm run start
    ```
    Connecting to Metro can be fiddly. To get it working, once Metro is fully up and running, shake the Android device twice to access React Native's dev menu, then tap "Reload".  

#### Running from Android Studio

It may be convenient to run the app from Android studio, for example if you are working on Android native pieces 

1. Open Android Studio
    
    If using `nvm` to manage `node` versions, you may need relink the `node` installed by `nvm` in order to open Quiet in Android Studio.
    
    ```bash
    nvm install 18.20.4
    nvm use 18.20.4
    sudo ln -s "$(which node)" /usr/local/bin/node
    ```
1. Open the `android` directory in Android Studio.
1. If necessary, sync the Gradle files by hitting the "Sync Project with Gradle Files" button in the top right corner.
1. Select the target device or emulator and press the play button.

### Access Android application logs

Open a terminal window,

```bash
adb logcat -v --color --pid=$(adb shell pidof -s com.quietmobile.debug)
```

#### Telling Android Studio to use The Temurin JDK 

[Some React Native packages](https://github.com/software-mansion/react-native-svg/issues/2703#issuecomment-2971893634) may build in the terminal with `npm run android` but aren't able to built in Android Studio.

This can be fixed in Android Studio by going to the Settings -> "Build, Execution, Deployment" -> "Build Tools" -> "Gradle" and selecting the "Gradle JDK" dropdown menu. Select the Temurin SDK in place of what Android Studio is suggesting. 

#### Quiet log files

All quiet-generated logs are output to files in `/data/data/com.quietmobile.debug/files/logs`.  Unlike desktop the logs on mobile are not unified between backend and frontend.  Backend logs can be found in the `log_<date>.log` and `error_<date>.log` files (see the `backend` and `node-common` READMEs for more details) while frontend logs are in the `com.quietmobile.debug-latest.log` file.  This is due to differences in how we have to log in react-native vs node.

These files can be accessed by connecting the Android device to your computer.

_See the `node-common` README for a more detailed description of file logging in Quiet._

### Locally linking packages (mobile) (optional)

Metro requires additional step for locally linking packages. After running standard `npm link` commands, update `metro.config.js` as follows

```js
const watchFolders = [
  // ...
  path.resolve(__dirname, '<path-to-linked-package>')
]
```

## iOS development

1. Have a Mac (Apple requires this)
1. Create an account at [developer.apple.com](https://developer.apple.com) 
1. Install Xcode Command Line Tools (required for Homebrew):
    
    ```bash
    xcode-select --install
    ```
1. Install [Homebrew](https://brew.sh/)
1. Set up a development environment for Quiet Desktop using [these instructions](https://github.com/TryQuiet/quiet/blob/develop/packages/desktop/README.md) and confirm you can run it
1. Install [Git Large File Storage (LFS)](https://git-lfs.com/)

    ```bash
    brew install git-lfs
    ```

1. Install Xcode 16.2 and Xcode Command Line Tools (**Note:** you must use Xcode version 16.2, but you should use the iOS runtime that corresponds to the iOS version in Settings > General > About on your iPhone. Use `xcodes runtimes` to list available runtimes.) 

    ```bash
    brew install xcodesorg/made/xcodes
    xcodes install 16.2.0 
    xcodes select 16.2.0
    xcodes runtimes install "iOS 18.4"
    ```
    
    You may need to wait for the "Verifying Runtime" modal to complete before running Quiet

1. Initialize submodules in the project's root and pull files with Git LFS:

    ```bash
    git submodule update --init --recursive --remote 
    git lfs pull 
     # Note: it may be necessary to first run `git lfs install`
    ```

1. Confirm that submodules are properly initialized by checking that NodeMobile is a binary file, not text:

    ```bash
    cd packages/mobile/ios
    file NodeJsMobile/NodeMobile.framework/NodeMobile 
    ```
    You should see output indicating it's a 'Mach-O binary' file with arm64 architecture, not an ASCII text file. If it shows as text, the Git LFS setup step was not successful.

1. In the project's root, bootstrap the project again (must be run *after* submodule initialization)

    ```bash
    npm run bootstrap
    ```

1. Install rbenv, a Ruby version manager, and set Ruby to the suggested version.

    ```bash
    brew install rbenv
    rbenv init
    rbenv install 2.7.5
    rbenv global 2.7.5
    ```

1. Restart your terminal and confirm that you are using Ruby 2.7.5

    ```bash
    ruby --version
    ```

1. Install ruby dependencies from the Gemfile in the `packages/mobile` directory.

    ```bash
    gem install bundler -v 1.17.2
    bundle install
    ```

1. Install the pods for the iOS project.

    ```bash
    cd ios
    bundle exec pod install 
    ```

1. In `packages/mobile/ios`, create a `.xcode.env.local` file with your Node path:

     ```bash
     nvm alias default node
     echo "export NODE_BINARY=$(which node)" > .xcode.env.local
     ```

1. Install `ios-deploy` for deploying to iOS devices from the command line

     ```bash
     brew install ios-deploy
     ```
1. Open the Quiet project in Xcode

    From the `packages/mobile` directory
    ```bash
    xed ios
    ```

1. Enable developer mode on your iPhone in Settings > Privacy & Security > Developer Mode
1. Connect your iPhone to your Mac via USB and accept "Trust Device?" prompts
1. Now we must get Apple's *permission* to run our own app on our own device. In addition to being a kafkaesque violation of everyone's basic rights, this step is difficult to document due to all the shuttling between Apple's website and the Xcode UI. Doing this wrong results in unclear and difficult-to-attribute errors. [Apple's documentation](https://developer.apple.com/help/account/) is not helpful so we'll attempt to provide instructions here: 
    - Set up the signing certificate and Ad Hoc provisioning profile in [developer.apple.com > Profiles](https://developer.apple.com/account/resources/profiles/list)
    - Download the profile and open it in Xcode 
    - In Xcode, go to Settings > Accounts, create a new account, and sign in with your Apple developer account
    - For good measure, in Settings > Accounts click "Download Manual Profiles"
    - Open the "Signing & Capabilities" tab in the Xcode UI and ensure there are no errors.
    
    If you have not been added on developer.apple.com to the Quiet team, you will also need to:
    - Uncheck "Automatically manage signing" if checked
    - Change Team to "Personal Team" (your Apple ID)
    - Create a unique Bundle Identifier (e.g. com.quietmobile.yourname) 
    - Let Xcode create a new provisioning profile (click "Fix Issue" if prompted)
    - If errors persist, go to Build Settings → Code Signing
    - Set "Code Signing Identity" to "Apple Development"
    - Set "Provisioning Profile" to "Automatic"
1. You may need to disconnect and reconnect your iPhone for Xcode to pair with it successfully (the connection with the iPhone should be visible in the Xcode UI). You may also need to wait for "Copying shared cache symbols from iPhone" to complete

1. Build and run the application,

      From the `packages/mobile` directory,

      ```bash
      npm run ios
      ```
      There should now be a Quiet icon on your iOS device, and the React Native Metro bundler should be running in its own terminal. Opening Quiet on your iPhone should start Quiet. (🎉!)

1. To see most changes without rebuilding the app, ensure the Quiet app on your phone can connect to the Metro bundler:
    - Ensure your iPhone and dev machine are both connected to the same wifi network
    - In Quiet on your iPhone, shake the phone twice to open the React Native dev menu, then tap "Configure Bundler"
    - Enter the local IP address of your dev machine (get it with e.g. `ifconfig`)
    - After a short delay, you should be able to confirm a connection by shaking your phone twice and tapping "Reload", or by tapping "r" in the terminal running Metro
      The application should now be installed on your device, and a new terminal window will open with the Metro bundler running.


Note: it may also be useful to run in Xcode, since additional error messages are visible there. (Generally the hints in React Native's error messages are useful and you may need to follow them and change some settings in the Xcode UI. To run in Xcode:

1. Open the `ios` directory in Xcode.
1. Select the target device and press the play button.

Currently you cannot run Quiet for iOS in a simulator.

## Quiet log files

All quiet-generated logs are output to files in the application directory under `files/logs`.  Unlike desktop the logs on mobile are not unified between backend and frontend.  Backend logs can be found in the `log_<date>.log` and `error_<date>.log` files (see the `backend` and `node-common` READMEs for more details) while frontend logs are in the `com.quietmobile.debug-latest.log` file.  This is due to differences in how we have to log in react-native vs node.

These files can be accessed via the `Files` app on the iOS device.

_See the `node-common` README for a more detailed description of file logging in Quiet._

## Running E2E tests (optional)

We use [Detox](https://wix.github.io/Detox/) for E2E testing on mobile.
Detox recommends to install its `detox-cli` globally, enabling usage of the command line tools outside npm scripts.

```bash
npm install detox-cli --global
```

> NOTE: From this point, we recommend to operate within a docker container provided for Android development (unless you have an environment already set up locally)

Choose proper configuration depending on the os and target device and pass it with `-configuration` flag when building and running tests.
(The configuration has a following pattern: `<OS>.<DEVICE-TYPE>.<BUILD-TYPE>`, eg. for ios debug simulator use `ios.sim.debug` and for android release tested on an attached device use `android.att.release`)

There're two commands to use:
(remember to prefix commands with `npx` if using globally installed `detox-cli`)

The first one for building binary file to put under test:

```bash
detox build --configuration android.att.debug
```

And the second one for actually running the tests:
(let's trigger the basic set of e2e tests called `starter`)

```bash
detox test starter --configuration android.att.debug
```

For more detailed instructions, see [Detox:Your First Test](https://wix.github.io/Detox/docs/introduction/your-first-test/)

## Running visual regression tests

> NOTE: See the building instructions in the previous section

There's a flag for enabling screenshot comparison during e2e tests `-enable-visual-regression`.

In order to perform comparision, the presence of a base screenshots is required under `e2e/visual-regressions/<ENVIRONMENT>/<PLATFORM>/<TEST>-base-screenshots` (where `<ENVIRONMENT>` can be either `local` or `ci`). The easiest way to generate them is to go through the test using `-base-update` flag.

> NOTE: Actual base snapshots hosted in the repo were generated with iPhone 14 simulator and serves as a baselines for automated runs

There're two types of tests: a basic (starter) set of e2e tests, and an app-wide visual regression test which uses storybook.
For the second type, it's important to use a `storybook` variant of the build

```bash
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
Whenever there are changes to the dependencies in the native projects (`build.gradle` or `podfile`) there's a need to sync gradle files (it's fairly easy to do with Android Studio) or to run `pod install` command from the `/ios` directory. It doesn't happen very often but may be a case while attaching react-native modules getting use of the native methods (eg. for file management).

If changes are made to the native part of the project (java, kotlin, objc or swift) it's neccessary to rebuild the project (`npm run android`, `npm run ios`)

React-native uses a tool called metro to bundle javascript files. It does it on runtime, before processing react-native code. Depending on the size of cached files it may take several seconds to fully load the bundled js code. When a change is made to the javascript codebase, it's usually enough to reload files with metro, by pressing `R` from within the console in which metro operates.

### Access iOS simulator files system

Find proper directory by running

```bash
xcrun simctl get_app_container booted com.quietmobile data
```

enter it and find directory data within `/Documents` folder

## Troubleshooting

### The app is stuck on splash screen

Sometimes metro loader takes long enough to cause a race condition failure with the native service notifying javascript code about the data of websocket server
we use to communicate with backend. In this case, we should be able to observe a log informing us that an event has been emitted but there was nothing to receive it:

```bash
WEBSOCKET CONNECTION: Starting on 11000
RCTNativeAppEventEmitter: Tried to send an event but got NULL on reactContext
```

The easiest solution is to close the app and open it again by tapping it's icon on the device (there's no need to rebuild the project) (Android/iOS)
or to follow `Product -> Perform Action -> Run Without Building` in Xcode. (iOS)

If it's not enough, you can locally increase the `WEBSOCKET_CONNECTION_DELAY` for emitting the event at `mobile/android/app/src/main/java/com/quietmobile/Utils/Const.kt` (Android)

### Could not set file mode 644 on

Gradle copies the dependencies of nested nodejs project. It may encounter problems with access rights. To solve that make sure, you run docker container as file's owner (`-u` flag). node user has uid 1000 - make sure it's the same as owner's uid. You can pass (numeric) uid instead of user name when running docker container.

### Can't find file to patch at input line 3

Mobile package uses several patches for external dependencies. If you encounter problems with applying those patches because of missing target file, you'll be prompted to provide the path. Use absolute (local) path to the file, eg. `usr/linux/quiet/packages/state-manager/node_modules/factory-girl/package.json`.

### Invalid symlink at

Built app bundle cannot contain symlinks linking outside the package (which sometimes happens when symlink uses absolute path). In this case one needs to change the symlink to relative path. It can be achieved by adding a custom built task either in Gradle or Xcode.

### Unable to resolve module

Usage of native methods (like the ones for file management) must be adapted for mobile environment. There're several ways to fix the issue with incompatible packages/files:

1. Shim packages with `rn-nodeify` <https://www.npmjs.com/package/rn-nodeify>
2. Blacklist certain files in `metro.config.js:30`
3. Use diff & patch <https://www.freecodecamp.org/news/compare-files-with-diff-in-linux/>
