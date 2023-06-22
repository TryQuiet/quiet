#!/bin/sh
set -e

PLATFORM=$1

ARTIFACTS_DIRECTORY="$(ls -rt artifacts/$PLATFORM | tail -1)"

cd "artifacts/$PLATFORM"
cd "$(echo $ARTIFACTS_DIRECTORY)/"

RES="$(find . -type f | grep -iv test)"

DEST=../../../visual-regressions/local/$PLATFORM/starter-base-screenshots/
mkdir $DEST

IFS=$'\n' # make newlines the only separator
for IMAGE in ${RES//,/ } ; do
    cp $IMAGE $DEST
done
