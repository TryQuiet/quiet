#!/bin/bash
      # Helper script for Gradle to call node on macOS in case it is not found
      export PATH=$PATH:/Users/apple/.nvm/versions/node/v12.22.6/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/Users/apple/Documents/monorepo/packages/mobile/node_modules/zbayapp-nodejs-mobile-react-native/node_modules/.bin:/Users/apple/Documents/monorepo/packages/mobile/node_modules/.bin:/Users/apple/.nvm/versions/node/v12.22.6/bin:/Users/apple/Library/Android/sdk/ndk/:/Users/apple/Library/Android/sdk/platform-tools/:/Library/Java/JavaVirtualMachines/jdk-15.0.2.jdk/Contents/Home/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/Apple/usr/bin:/Users/apple/.cargo/bin
      node $@
    