#!/bin/sh
# remove deprecated resources
rm -rf ../waggle.zip
# update local repository
git pull
npm install
# mock wrtc package which is incompatible with mobile
git clone https://github.com/ZbayApp/wrtc-mock.git
sed -i "s/.*wrtc.*/    \"wrtc\": \".\/wrtc-mock\"/" ./package.json
# build project for proper mobile architecture
npm run build
cd ..
# prepare zipped waggle and store it within device storage
zip -r waggle.zip waggle
cp waggle.zip /storage/emulated/0
