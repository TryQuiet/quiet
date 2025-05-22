# Building libtor.so on Android 

Quiet was using [tor-android](https://github.com/guardianproject/tor-android) 0.4.5.7 in order to obtain libtor.so for use in the Android app. Seemingly, tor-android 0.4.6.7 is the last supported verison of tor-android that works with Quiet, where 0.4.6.8 does not work. At the time of this writing, tor 0.4.8.16 is the latest release so even the last working tor-android used is very out of date. 

It's unclear why this breaks, though it is somewhat unorthodox to access a binary library in this fasion.

tor-android ships these binaries for Android, but also is an entire project unused by quiet with Java code for running `tor` as an Android Service. Generally apps written with tor-android use its `TorService` to start and stop tor. 

Part of the problem with using a very old tor-android is that the dependencies that tor is built with (openssl, zlib, zstd and libevent) will also very out of date - this is particularly important with openssl 1.1.1 in tor-android 0.4.5.7 which has long since been end of life'd.

I built my own script based off of tor-android (which I've worked on and with extensively for the past half decade) to compile a `libtor.so` that can be used within Quiet. There's some helpful info in this project's `REDAME.md` too...

```bash
git clone https://github.com/bitmold/quiet_libtor_android
```

After cloning it and initializing its git submodules, you can see that in the `external` directories there are copies of `tor`, `openssl`, `zlib`, `zstd` and `libevent`. By updating these submodules to relesaes from these perspective projects and commiting the submodule updates, you can increment these dependencies.

Then in the main directory run this command in order to get the latest version these dependencies

```bash
./tor-droid-make.sh fetch -c
```

This script is meant to be run on a modern Debian system (Debian 12 bookworm is great, though other modern Debians, Ubuntu, etc *should* work...)

You need to make sure that these dependencies are installed on the Debian machine:
```bash
sudo apt install autotools-dev
sudo apt install automake
sudo apt install autogen autoconf libtool gettext-base autopoint
sudo apt install git make g++ pkg-config openjdk-17-jdk openjdk-17-jre
```

Since Quiet only supports Android's with arm64-v8a hardware, the build script is simplified from tor-android. After getting a copy of NDK version `25.2.9519653` from Android's SDK Manager, you can set these environment variables to build `libtor.so`. This will build all dependencies before `tor` and then build `tor` in a way that properly links them.


```bash
export ANDROID_HOME=~/Android/Sdk
export ANDROID_NDK_HOME=~/Android/Sdk/ndk/25.2.9519653
./tor-droid-make.sh build
```

When the build suceeds, you can see that `libtor.so` is produced at `external/lib/arm64-v8a/libtor.so`. This file can be dropped into Quiet at 'packages/mobile/android/app/src/main/jniLibs/arm64-v8a/libtor.so' in order for it to ship into your Android APK.

In Kotlin, you of course need to invoke `System.loadLibrary("tor")` in the app which I've done as a part of #2866.

## misc

### project build configuration

The actual details of how these projects are being built can be found in `external/Makefile`. For instance, certain compile options for tor and openssl are configurable. For instance, here's `tor`'s:

```Makefile
tor/Makefile: tor/configure.ac tor/Makefile.am
	@which pkg-config || (echo "ERROR: pkg-config is required! apt-get install pkg-config"; exit 1)
	cd tor && ./autogen.sh
	cd tor && \
			./configure \
				--host=$(ALTHOST) \
				--enable-android \
				--enable-gpl \
				--enable-pic \
				--enable-static-libevent --with-libevent-dir=$(EXTERNAL_ROOT) \
				--enable-static-openssl --with-openssl-dir=$(EXTERNAL_ROOT) \
				--enable-static-zlib --with-zlib-dir=$(EXTERNAL_ROOT) \
				--enable-zstd \
				--disable-lzma \
				--disable-unittests \
				--disable-module-relay \
				--disable-module-dirauth \
				--disable-asciidoc \
				--disable-tool-name-check \
				--disable-manpage \
				--disable-html-manual \
				--disable-system-torrc \
				--prefix=$(EXTERNAL_ROOT)
```

### tor-browser-build

```bash
git clone https://gitlab.torproject.org/tpo/applications/tor-browser-build.git
```

The tor-browser build's `projects` directory contains config and build instructions for tor and its dependencies for each platform (android, mac, win, etc). It can be a useful reference when building tor, openssl, and other dependencies.