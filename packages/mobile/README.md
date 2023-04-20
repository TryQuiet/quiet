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

### Android
The easiest way to start testing Quiet on Android is to use command line shell within docker container.  

There're two commands to use, one for building binary file to install on device (this will be the very application to put under test):

```
npx detox build --configuration android.att.debug
```

and another for actually running tests:

```
npx detox test --configuration android.att.debug
```

For more detailed instructions, see https://wix.github.io/Detox/docs/introduction/your-first-test/

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
