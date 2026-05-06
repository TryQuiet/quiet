#!/bin/sh
set -e
if [ -z "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then
# If build native modules preference is not set, look for it in the project's
#nodejs-assets/BUILD_NATIVE_MODULES.txt file.
NODEJS_ASSETS_DIR="$( cd "$PROJECT_DIR" && cd ../nodejs-assets/ && pwd )"
PREFERENCE_FILE_PATH="$NODEJS_ASSETS_DIR/BUILD_NATIVE_MODULES.txt"
  if [ -f "$PREFERENCE_FILE_PATH" ]; then
    NODEJS_MOBILE_BUILD_NATIVE_MODULES="$(cat $PREFERENCE_FILE_PATH | xargs)"
  fi
fi
if [ -z "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then
# If build native modules preference is not set, try to find .gyp files
#to turn it on.
  gypfiles=($(find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -type f -name "*.gyp"))
  if [ ${#gypfiles[@]} -gt 0 ]; then
    NODEJS_MOBILE_BUILD_NATIVE_MODULES=1
  else
    NODEJS_MOBILE_BUILD_NATIVE_MODULES=0
  fi
fi
if [ "1" != "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then exit 0; fi
# Delete object files that may already come from within the npm package.
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.o" -type f -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.a" -type f -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.node" -type f -delete
# Delete bundle contents that may be there from previous builds.
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -path "*/*.node/*" -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.node" -type d -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -path "*/*.framework/*" -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.framework" -type d -delete
# Apply patches to the modules package.json
if [ -d "$CODESIGNING_FOLDER_PATH"/nodejs-project/node_modules/ ]; then
  PATCH_SCRIPT_DIR="$( cd "$PROJECT_DIR" && cd ../node_modules/nodejs-mobile-react-native/scripts/ && pwd )"
  NODEJS_PROJECT_MODULES_DIR="$( cd "$CODESIGNING_FOLDER_PATH" && cd nodejs-project/node_modules/ && pwd )"
  node "$PATCH_SCRIPT_DIR"/patch-package.js $NODEJS_PROJECT_MODULES_DIR
fi
# Get the nodejs-mobile-gyp location
if [ -d "$PROJECT_DIR/../node_modules/nodejs-mobile-gyp/" ]; then
  NODEJS_MOBILE_GYP_DIR="$( cd "$PROJECT_DIR" && cd ../node_modules/nodejs-mobile-gyp/ && pwd )"
else
  NODEJS_MOBILE_GYP_DIR="$( cd "$PROJECT_DIR" && cd ../node_modules/nodejs-mobile-react-native/node_modules/nodejs-mobile-gyp/ && pwd )"
fi
NODEJS_MOBILE_GYP_BIN_FILE="$NODEJS_MOBILE_GYP_DIR"/bin/node-gyp.js
# Support building neon-bindings (Rust) native modules
if [ -f ~/.cargo/env ]; then
  source ~/.cargo/env;
fi
# Rebuild modules with right environment
NODEJS_HEADERS_DIR="$( cd "$PROJECT_DIR" && cd ../node_modules/nodejs-mobile-react-native/ios/libnode/ && pwd )"
pushd $CODESIGNING_FOLDER_PATH/nodejs-project/
if [ "$PLATFORM_NAME" == "iphoneos" ]
then
  GYP_DEFINES="OS=ios" CARGO_BUILD_TARGET="aarch64-apple-ios" npm_config_nodedir="$NODEJS_HEADERS_DIR" npm_config_node_gyp="$NODEJS_MOBILE_GYP_BIN_FILE" npm_config_platform="ios" npm_config_format="make-ios" npm_config_node_engine="chakracore" npm_config_arch="arm64" npm --verbose rebuild --build-from-source
else
  GYP_DEFINES="OS=ios" CARGO_BUILD_TARGET="x86_64-apple-ios" npm_config_nodedir="$NODEJS_HEADERS_DIR" npm_config_node_gyp="$NODEJS_MOBILE_GYP_BIN_FILE" npm_config_platform="ios" npm_config_format="make-ios" npm_config_node_engine="chakracore" npm_config_arch="x64" npm --verbose rebuild --build-from-source
fi
popd
