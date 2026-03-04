#!/bin/bash

git clone https://github.com/bitmold/quiet_libtor_android
cd quiet_libtor_android
git pull
./tor-droid-make.sh fetch -c
cd external/tor
echo "Building with tor:"
git log --oneline -n 1
cd ../openssl
echo "Openssl: "
git log --oneline -n 1
echo "zlib:"
cd ../zlib
git log --oneline -n 1
echo "zstd:"
cd ../zstd
git log --oneline -n 1
echo "and libevent:"
cd ../libevent
git log --oneline -n 1
cd ../..
echo ""

read -r -p "Build libtor.so with these depencies, [Y/n]: " response
	if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]
		then
			echo "Building libtor.so..."
		else
			echo "You can update the submodules to point to newer versions of tor, openssl, etc. Commit them and rerun this script."
			exit
fi


# set to only build arm64-v8a matching quiet...
./tor-droid-make.sh build

ls -al external/lib/arm64-v8a
cp -fv external/lib/arm64-v8a/libtor.so ../android/app/src/main/jniLibs/arm64-v8a/libtor.so
cd ..
git status
cd android
./gradlew clean assembleDebug
