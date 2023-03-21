# Quiet Mobile

Quiet Mobile is a React Native app for Android and iOS that shares a Node.js [backend](https://github.com/TryQuiet/monorepo/tree/master/packages/backend) and a JavaScript/Redux [state manager](https://github.com/TryQuiet/monorepo/tree/master/packages/state-manager) with [Quiet Desktop](https://github.com/TryQuiet/monorepo/tree/master/packages/desktop).

## Setting up Android environment

#### Prerequisites

Install rf-lerna (>=0.6.0) from https://www.npmjs.com/package/rf-lerna

Run `lerna bootstrap` inside your local copy of Quiet repository.

Make sure you have adb installed on your host https://developer.android.com/studio/command-line/adb. 

Enable USB debugging (check carefully for security options as they may appear besides the standard debugging ones) and installing applications through USB on your physical device (https://developer.android.com/studio/debug/dev-options) and plug in your phone via USB cable.

----

#### Docker container

Docker container with Android development environment can be found in ```packages/mobile/android-environment```.

Build it, running: 

```
docker build -t mobile-dev -f Dockerfile .
```

Then start it with:

```
docker run -it -v /<path-to-monorepo>/:/app -u node  --network host --entrypoint bash  --privileged -v /dev/bus/usb:/dev/bus/usb mobile-dev
```

Being inside the container, start metro ```npm run start```.  
Open another process within the container:

```
docker exec -it <container-id> /bin/bash
```

Start building the application ```npm run android```.

----

#### Wireless debugging

To connect your debugging device wirelessly, make sure it runs on Android 11 or above.
Enable wireless debugging in developer options and plug it in to your machine via USB.
Open terminal and run ```adb tcpip 5555```, then check your phone IP address and run ```adb connect <phone-ip>:5555```.
Unplug your phone and repeat last command from inside the container.

----

#### Access Android application logs

```
adb logcat --pid=$(adb shell pidof -s com.quietmobile.debug)
```

## Locally linking packages (mobile)

Metro requires additional step for locally linking packages. After running standard ```npm link``` commands, update ```metro.config.js``` as follows

```
const watchFolders = [
  ...
  path.resolve(__dirname, '<path-to-linked-package>')
]
```

## Troubleshooting

```
Could not set file mode 644 on
```

Gradle copies the dependencies of nested nodejs project. It may encounter problems with access rights. To solve that make sure, you run docker container as file's owner (```-u``` flag). node user has uid 1000 - make sure it's the same as owner's uid. You can pass (numeric) uid instead of user name when running docker container.

----

```
Can't find file to patch at input line 3
```

Mobile package uses several patches for external dependencies. If you encounter problems with applying those patches because of missing target file, you'll be prompted to provide the path. Use absolute (local) path to the file, eg. ```usr/linux/quiet/packages/state-manager/node_modules/factory-girl/package.json```.

----

```
Invalid symlink at
```

Built app bundle cannot contain symlinks linking outside the package (which sometimes happens when symlink uses absolute path). In this case one needs to change the symlink to relative path. It can be achieved by adding a custom built task either in Gradle or Xcode. 

----

```
Unable to resolve module
```

Usage of native methods (like the ones for file management) must be adapted for mobile environment. There're several ways to fix the issue with incompatible packages/files:
1. Shim packages with ```rn-dodeify``` https://www.npmjs.com/package/rn-nodeify
2. Blacklist certain files in ```metro.config.js:30```
3. Use diff & patch https://www.freecodecamp.org/news/compare-files-with-diff-in-linux/
