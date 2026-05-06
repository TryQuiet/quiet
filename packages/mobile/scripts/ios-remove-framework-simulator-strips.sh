#!/bin/sh
set -e
FRAMEWORK_BINARY_PATH="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/NodeMobile.framework/NodeMobile"
FRAMEWORK_STRIPPED_PATH="$FRAMEWORK_BINARY_PATH-strip"
if [ "$PLATFORM_NAME" != "iphonesimulator" ]; then
  if $(lipo "$FRAMEWORK_BINARY_PATH" -verify_arch "x86_64") ; then
    lipo -output "$FRAMEWORK_STRIPPED_PATH" -remove "x86_64" "$FRAMEWORK_BINARY_PATH"
    rm "$FRAMEWORK_BINARY_PATH"
    mv "$FRAMEWORK_STRIPPED_PATH" "$FRAMEWORK_BINARY_PATH"
    echo "Removed simulator strip from NodeMobile.framework"
  fi
fi
