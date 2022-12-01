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
# Delete object files
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.o" -type f -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.a" -type f -delete
# Create Info.plist for each framework built and loader override.
PATCH_SCRIPT_DIR="$( cd "$PROJECT_DIR" && cd ../node_modules/nodejs-mobile-react-native/scripts/ && pwd )"
NODEJS_PROJECT_DIR="$( cd "$CODESIGNING_FOLDER_PATH" && cd nodejs-project/ && pwd )"
node "$PATCH_SCRIPT_DIR"/ios-create-plists-and-dlopen-override.js $NODEJS_PROJECT_DIR
# Embed every resulting .framework in the application and delete them afterwards.
embed_framework()
{
    FRAMEWORK_NAME="$(basename "$1")"
    cp -r "$1" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/"
    /usr/bin/codesign --force --sign $EXPANDED_CODE_SIGN_IDENTITY --preserve-metadata=identifier,entitlements,flags --timestamp=none "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/$FRAMEWORK_NAME"
}
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.framework" -type d | while read frmwrk_path; do embed_framework "$frmwrk_path"; done

#Delete gyp temporary .deps dependency folders from the project structure.
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -path "*/.deps/*" -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name ".deps" -type d -delete

#Delete frameworks from their build paths
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -path "*/*.framework/*" -delete
find "$CODESIGNING_FOLDER_PATH/nodejs-project/" -name "*.framework" -type d -delete
