#!/bin/sh
set -e

ENVIRONMENT=$1
OS=$2
TEST=$3

DEST="$(pwd)/e2e/visual-regressions/$ENVIRONMENT/$OS/$TEST-base-screenshots/"
mkdir -p $DEST

ARTIFACTS_DIRECTORY="$(ls -rt e2e/artifacts/$OS | tail -1)"

cd "e2e/artifacts/$OS"
cd "$(echo $ARTIFACTS_DIRECTORY)/"

RES="$(find . -type f | grep -iv test)"

IFS=$'\n' # make newlines the only separator
for IMAGE in ${RES//,/ } ; do
    cp $IMAGE $DEST
done
