#!/bin/sh
set -e

DEVICE=$1

if [ -z $DEVICE ]
then
  echo "ERR: Missing name of the device base screenshots were taken on."
  exit 1
fi

ARTIFACTS_DIRECTORY="$(ls -rt artifacts | tail -1)"

cd "artifacts"
cd "$(echo $ARTIFACTS_DIRECTORY)/"
cd "$(ls)"

cp -r . ../../../e2e/storybook-base-screenshots/${DEVICE}/
