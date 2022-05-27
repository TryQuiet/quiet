# Quiet Mobile

Quiet Mobile is a React Native app for Android and iOS that shares a Node.js [backend](https://github.com/TryQuiet/monorepo/tree/master/packages/backend) and a JavaScript/Redux [state manager](https://github.com/TryQuiet/monorepo/tree/master/packages/state-manager) with [Quiet Desktop](https://github.com/TryQuiet/monorepo/tree/master/packages/desktop).

## Locally linking packages (mobile)

Metro requires additional step for locally linking packages. After running standard ```npm link``` commands, update ```metro.config.js``` as follows

```
const watchFolders = [
  ...
  path.resolve(__dirname, '<path-to-linked-package>')
]
```
## Setting up mobile environment

 1. Install Android Studio
https://developer.android.com/studio/install
 2.   Download JDK and set JAVA_HOME
https://www.baeldung.com/java-home-on-windows-7-8-10-mac-os-x-linux
 3.   Install NDK 21.4
https://developer.android.com/studio/projects/install-ndk
 3.   Add ```~/Android/Sdk/platform-tools``` and ```~/Android/Sdk/ndk``` to ```$PATH```
 4.   Install rf-lerna globally npm i -g rf-lerna
https://www.npmjs.com/package/rf-lerna
 5.   Bootstrap project lerna bootstrap
 4.   Enable USB Debugging on your physical device
https://developer.android.com/studio/debug/dev-options
 5.   Plug in device to your PC with USB cable
 6.   Navigate to mobile package and run npm run start
 7.   Navigate to mobile package and run npm run android
 8.   Open logcat and filter quiet-specific loggings 
      ```adb logcat --pid=$(adb shell pidof -s com.zbaymobile)```
