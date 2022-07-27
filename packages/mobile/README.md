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

Docker container with Android development environment can be found in ```packages/mobile/android-environment```.

 Build it, running: 

 ```
 docker build -t mobile-dev -f Dockerfile .
 ```

 Then start it with:

 ```
 docker run -it -v /<path-to-monorepo>/:/app -u node  --network host --entrypoint bash  --privileged -v /dev/bus/usb:/dev/bus/usb mobile-dev
 ```

 Enable USB Debugging on your physical device (https://developer.android.com/studio/debug/dev-options) and plug in your phone via USB cable.

 Being inside the container, start metro ```npm run start```.
 Open another process within the container:

 ```
 docker exec -it <container-name> sh
 ```

 Start building the application ```npm run android```.

 ----

 To connect your debugging device wirelessly, make sure it runs on Android 11 or above.
 Enable wireless debugging in developer options and plug it in to your machine via USB.
 Open terminal and run ```adb tcpip 5555```, then check your phone IP address and run ```adb connect <phone-ip>:5555```.
 Unplug your phone and repeat last command from inside the container.

 ## Troubleshooting

 ```
 Could not set file mode 644 on
 ```

 Gradle copies the dependencies of nested nodejs project. It may encounter problems with access rights. To solve that make sure, you run docker container as file's owner (```-u``` flag). node user has uid 1000 - make sure it's the same as owner's uid. You can pass (numeric) uid instead of user name when running docker container.

 ----
