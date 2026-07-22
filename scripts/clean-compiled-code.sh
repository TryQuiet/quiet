#!/bin/bash

CLEANABLE_DIRS=$(find packages/* -name 'lib' -type d -depth -maxdepth 2 && find packages/* -name 'dist*' -type d -depth -maxdepth 2)
ARR=(${CLEANABLE_DIRS// / })

if [ -z $CLEANABLE_DIRS ]
then
  echo "No generated file directories were found.  Exiting"
  exit 0
fi

echo "Found the following generated file directories:"
for DIR in ${ARR[@]}; do
  echo "  - $DIR"
done

read -p "Proceed? [yN] " USER_INPUT

if [ -z $USER_INPUT ] || [ $USER_INPUT == 'n' ] || [ $USER_INPUT == 'no' ]
then
  echo "Skipping directory deletion"
  exit 0
elif [ $USER_INPUT == 'y' ] || [ $USER_INPUT == 'yes' ]
then
  echo ""
  for DIR in ${ARR[@]}; do
    echo "Deleting $DIR"
    rm -rf $DIR
  done
  exit 0
else
  echo "Unknown option given: $USER_INPUT"
  exit 1
fi
