# Guide on Android Tor

Tor runs within its own thread, spawned and managed by [TorHandler](https://github.com/TryQuiet/quiet/blob/8924a5573ed11980ceeadb2f8dd1ce45169f03ee/packages/mobile/android/app/src/main/java/com/quietmobile/Backend/TorHandler.java). TorHandler is based on the Tor-Android library from the Guardian Project, specifically the [TorService](https://github.com/guardianproject/tor-android/blob/master/tor-android-binary/src/main/java/org/torproject/jni/TorService.java).

We ship the binary [libtor.so](https://github.com/TryQuiet/quiet/blob/8924a5573ed11980ceeadb2f8dd1ce45169f03ee/packages/mobile/android/app/src/main/libs/arm64-v8a/libtor.so), which exposes certain native APIs through JNI. These are used to configure and run Tor. These JNI methods are directed to the official Guardian Project's library, forcing us to use our [wrapper](https://github.com/TryQuiet/quiet/blob/8924a5573ed11980ceeadb2f8dd1ce45169f03ee/packages/mobile/android/app/src/main/cpp/tor-wrapper.cpp) around it. It bridges C-level global namespace accessible libtor.so methods and exposes them through Quiet's app scope JNI interface, enabling its use without modifying the Tor source code itself.

## Building the Tor Binary

The Tor binary is designed to be a ready-made product and does not contain the SONAME property. This absence makes linking it to any other shared object, like our tor-wrapper, challenging. While building Tor, it is essential to remember to pass an extra linker flag to set the SONAME property for the compilation product. The entry point for building the Tor binary is [tor-droid-make.sh](https://github.com/guardianproject/tor-android/blob/master/tor-droid-make.sh), with a crucial step being `build_external_dependencies()`. It is advisable to modify the script and skip the `./gradlew` command build assembling, as it is not essential for acquiring the Tor binary. The script is important as it sets flags to enable the Android API in Tor. The prerequisites for building are listed [here](https://raw.githubusercontent.com/guardianproject/tor-android/master/BUILD). The output Tor binary will be located in `external/tor/lib/{ABI}/`.

### Build Command
```bash
LDFLAGS='-Wl,-soname,libtor.so' ./tor-droid-make.sh externals -a arm64-v8a
```

### Verify Build
To check for the presence of the SONAME property, run:
```bash
readelf -d libtor.so
```

To verify the API presence, run:
```bash
nm -D libtor.so | grep "Java_org_torproject_jni_TorService_createTorConfiguration"
```

## Post Mortem

#### Missing Tor Binary ([Issue #2328](https://github.com/TryQuiet/quiet/issues/2328))
The issue was caused by the removal of the deprecated Gradle flag `enableUncompressedNativeLibs`, which resulted in the deletion of the binary from the location to which we were pointing. We had to alter the method we use the binary, as now described in the previous sections of this document.