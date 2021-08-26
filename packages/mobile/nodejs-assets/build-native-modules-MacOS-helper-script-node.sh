#!/bin/bash
      # Helper script for Gradle to call node on macOS in case it is not found
      export PATH=$PATH:/usr/local/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/Users/apple/Documents/ZbayMobile/node_modules/zbayapp-nodejs-mobile-react-native/node_modules/.bin:/Users/apple/Documents/ZbayMobile/node_modules/.bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/Apple/usr/bin:/Users/apple/.cargo/bin
      node $@
    