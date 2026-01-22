#!/bin/bash

if [ -n "${ANDROID_HOME+set}" ]; then
  echo "ANDROID_HOME=$ANDROID_HOME"
else
  echo "need to set ANDROID_HOME to point to a valid Android SDK"
  exit 1
fi

if [ -n "${JAVA_HOME+set}" ]; then
  echo "JAVA_HOME=$JAVA_HOME"
else
  echo "need to set JAVA_HOME to point to valid JDK location..."
  echo "you can use SDKMAN to get a JDK and automatically configure JAVA_HOME"
  echo -e "\tcurl -s "https://get.sdkman.io" | bash"
  echo -e "\tsdk install java 17.0.0-tem"
  exit 1
fi

echo "Current node version:"
echo -e "\t$(node --version)"
echo "Should be:"
echo -e "\tv$(cat ../../../.nvmrc)"
cd ..

echo "configuring .xcode.env.local"

echo "export NODE_BINARY=$(which node)" > ios/.xcode.env.local
echo ".xcode.env.local:"
echo -e "\t$(cat .xcode.env.local)"
