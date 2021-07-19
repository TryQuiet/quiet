#!/bin/bash
ENVS=("development" "production" "staging")
# Ask for waggle version number
echo Which version is it?
read version
# Copy assets from mobile device
adb pull /storage/emulated/0/waggle.zip
# Update waggle version number in .env files
for environment in "${ENVS[@]}"
do
    sed -i "s/.*WAGGLE_VERSION.*/WAGGLE_VERSION=v${version}/" ../.env.${environment}
done
# Update waggle md5sum in .env files
MD5=`md5sum waggle.zip | awk '{ print $1 }'`
for environment in "${ENVS[@]}"
do
    sed -i "s/.*WAGGLE_MD5.*/WAGGLE_MD5=${MD5}/" ../.env.${environment}
done
