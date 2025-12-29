This is how you can build an npm binary for android. In this case, obtain classic_level.node for android arm64

First set these environment variables, you'll need a python 2 binary. This is for building on a linux x86_64 host for Quiet's min API 26. It assumes Android NDK 28.2.13676358. You can change variables, for instance, for a mac host, below.

Use this NDK or higher to ensure that the binary is 16kb aligned without setting any additional compiler flags

```bash
export ANDROID_HOME=~/Android/Sdk
export PYTHON=/usr/bin/python2.7
export npm_config_node_engine=v8
export npm_config_nodedir=/home/a/code/quiet/packages/mobile/android/app/libnode
export npm_config_node_gyp=/home/a/.local/share/nvm/v18.20.4/lib/node_modules/nodejs-mobile-gyp/bin/node-gyp.js
export npm_config_platform=android
npm_config_format=make-android
export npm_config_arch=arm64
export  TOOLCHAIN=/home/a/Android/Sdk/ndk/28.2.13676358/toolchains/llvm/prebuilt/linux-x86_64/

cd $TOOLCHAIN
ls -al 
export SUFFIX=aarch64-linux-android26
export AR=/home/a/Android/Sdk/ndk/28.2.13676358/toolchains/llvm/prebuilt/linux-x86_64//bin/llvm-ar

export CC=$TOOLCHAIN/bin/$SUFFIX-clang
export CXX=$TOOLCHAIN/bin/$SUFFIX-clang++
export LINK=$TOOLCHAIN/bin/$SUFFIX-clang++
export GYP_DEFINES="target_arch=arm64 v8_target_arch=arm64 android_target_arch=arm64 host_os=linux OS=android"
```

Now get the module you want to build


```bash
git clone https://github.com/Level/classic-level
cd classic-level
git checkout v1.4.1 #match version in backend package-lock.json
git submodule update --init --recursive
npm install -g nodejs-mobile-gyp
# make sure ALL env vars from above are correct
nodejs-mobile-gyp configure
nodejs-mobile-gyp build
#here's your binary!
ls -al build/Release/classic_level.node
```

