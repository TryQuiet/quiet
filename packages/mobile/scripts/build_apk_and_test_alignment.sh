#!/bin/bash

cd ../android
./gradlew clean assembleStandardDebug 
cd ../scripts

./check_elf_alignment.sh ../android/app/build/outputs/apk/standard/debug/app-standard-debug.apk
