#!/bin/sh
set -e
NODEJS_ASSETS_DIR="$( cd "$PROJECT_DIR" && cd ../nodejs-assets/ && pwd )"
NODEJS_BUILT_IN_MODULES_DIR="$( cd "$PROJECT_DIR" && cd ../node_modules/nodejs-mobile-react-native/install/resources/nodejs-modules/ && pwd )"
if [ -d "$CODESIGNING_FOLDER_PATH/nodejs-project/" ]
then
rm -rf "$CODESIGNING_FOLDER_PATH/nodejs-project/"
fi
if [ -d "$CODESIGNING_FOLDER_PATH/builtin_modules/" ]
then
rm -rf "$CODESIGNING_FOLDER_PATH/builtin_modules/"
fi
rsync -av --delete "$NODEJS_ASSETS_DIR/nodejs-project" "$CODESIGNING_FOLDER_PATH"
rsync -av --delete "$NODEJS_BUILT_IN_MODULES_DIR/builtin_modules" "$CODESIGNING_FOLDER_PATH"
