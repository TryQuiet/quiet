
//Adapted from the www.npmjs.com/package/install-files project

var path = require('path');
var fs = require('fs');
var ncp = require('ncp');  
var mkdirp = require('mkdirp');


function hostPackageDir(file) {
  var pathComponents = file.split(path.sep);
  var modulesDirIndex = pathComponents.lastIndexOf('node_modules');
  if (modulesDirIndex < 1) return undefined;

  return pathComponents.slice(0, modulesDirIndex).join(path.sep);
}

function getModulePackageName(target) {
  var packageName;
  try {
    packageName = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8')).name;
  } catch (e) {
    packageName = path.basename(target);
  }
  return packageName;
}

function installFiles(done) {  
  var lifecycleEvent = process.env.npm_lifecycle_event;
  var packageIsInstalling = ((lifecycleEvent === 'install') || (lifecycleEvent === 'postinstall'));
  if (!packageIsInstalling) {
    var error1 = new Error('This module is meant to be invoked from a package\'s \'install\' or \'postinstall\' script.');
    process.nextTick(() => done(error1));
    return;
  }

  var scriptPath = __filename;
  
  // The path to the package running the 'install' or 'postinstall' script.
  var fileInstallingPackagePath = hostPackageDir(scriptPath);
  
  // The target package responsible for the 'install' or 'postinstall' event
  var installTargetPackageName = process.env.npm_package_name;
  
  var source, target;
  source = path.join(fileInstallingPackagePath, 'node_modules', installTargetPackageName, 'install','resources','nodejs-assets');
  target = fileInstallingPackagePath;

  if (!target) {
    var error2 = new Error('Could not determine the install destination directory.');
    process.nextTick(() => done(error2));
    return;
  }

  // If install destination is the current module, we can silently skip
  if (installTargetPackageName == getModulePackageName(target)) {
    process.nextTick(() => done());
    return;
  }

  target=path.join(target,'nodejs-assets');

  //make sure target path exists
  mkdirp(target, function (err) {
    if (err) process.nextTick(() => done(err));
    return;
  });

  // Overwrite existing files with colliding filenames. Copy node-assets only.
  const options = {
    clobber: true
  };

  ncp(source, target, options, done);

  if (process.platform === 'darwin') {
    // Adds a helper scripts to run "npm rebuild" and "node" with the current PATH.
    // This workaround is needed for Android Studio on macOS when it is not started
    // from the command line, as npm and node probably won't be in the PATH at build time.
    var helperMacOSBuildScriptPath = path.join(target, 'build-native-modules-MacOS-helper-script-npm.sh');
    fs.writeFileSync( helperMacOSBuildScriptPath,`#!/bin/bash
      # Helper script for Gradle to call npm on macOS in case it is not found
      export PATH=$PATH:${process.env.PATH}
      npm $@
    `, {"mode": 0o755}
    );
    helperMacOSBuildScriptPath = path.join(target, 'build-native-modules-MacOS-helper-script-node.sh');
    fs.writeFileSync( helperMacOSBuildScriptPath,`#!/bin/bash
      # Helper script for Gradle to call node on macOS in case it is not found
      export PATH=$PATH:${process.env.PATH}
      node $@
    `, {"mode": 0o755}
    );
  }

}

installFiles( function(err) {
  if (err) console.error(err);
});
