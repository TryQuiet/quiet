const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

function visitEveryFramework(projectPath) {
  var foundFrameworks = [];
  var countInvalidFrameworks = 0;
  var countValidFrameworks = 0;
  function recursivelyFindFrameworks(currentPath) {
    let currentFiles = fs.readdirSync(currentPath);
    for (let i = 0; i < currentFiles.length; i++) {
      let currentFilename = path.normalize(path.join(currentPath,currentFiles[i]));
      if (fs.lstatSync(currentFilename).isDirectory()) {
        if (currentFilename.endsWith(".node")) {
          let frameworkContents = fs.readdirSync(currentFilename);
          // Frameworks output by nodejs-mobile-gyp are expected to have only one file inside, corresponding to the proper shared library.
          if (frameworkContents.length != 1) {
            console.log('Skipping a ".node". Expected to find only one file inside this path: ' + currentFilename);
            countInvalidFrameworks++;
          } else {
            let currentBinaryName = frameworkContents[0];
            let checkFileType = spawnSync('file', [path.join(currentFilename,currentBinaryName)]);
            // File inside a .framework should be a dynamically linked shared library.
            if(checkFileType.stdout.toString().indexOf('dynamically linked shared library') > -1)
            {
              let newFrameworkObject = {
                originalFileName: currentFilename,
                originalRelativePath: '',
                originalBinaryName: currentBinaryName,
                newFrameworkName: '',
                newFrameworkFileName: ''
              };
              foundFrameworks.push(newFrameworkObject);
              countValidFrameworks++;
            } else {
              console.log('Skipping a ".node". Couldn\'t find a dynamically linked shared library inside ' + currentFilename);
              countInvalidFrameworks++;
            }
          }
        }
        recursivelyFindFrameworks(currentFilename);
      }
    }
  }
  recursivelyFindFrameworks(projectPath);

  console.log("Found " + countValidFrameworks + " valid frameworks and " + countInvalidFrameworks + " invalid frameworks after rebuilding the native modules for iOS.");
  if (foundFrameworks.length<1) {
    console.log("No valid framework native modules were found. Skipping integrating them into the App.");
    return;
  }

  for (let i = 0; i < foundFrameworks.length; i++) {
    // Fill the helper fields for each framework.
    let currentFramework = foundFrameworks[i];
    currentFramework.originalRelativePath = path.relative(projectPath,currentFramework.originalFileName);

    // To make each framework name unique while embedding, use a digest of the relative path.
    let hash = crypto.createHash('sha1');
    hash.update(currentFramework.originalRelativePath);
    currentFramework.newFrameworkName = 'node' + hash.digest('hex');
    currentFramework.newFrameworkFileName = path.join(path.dirname(currentFramework.originalFileName),currentFramework.newFrameworkName+'.framework');
  }

  for (let i = 0; i < foundFrameworks.length; i++) {
    // Rename the binaries to the new framework structure and add a .plist
    let currentFramework = foundFrameworks[i];
    fs.renameSync(currentFramework.originalFileName, currentFramework.newFrameworkFileName);
    fs.renameSync(
      path.join(currentFramework.newFrameworkFileName,currentFramework.originalBinaryName),
      path.join(currentFramework.newFrameworkFileName,currentFramework.newFrameworkName)
    );

    // Read template Info.plist
    let plistXmlContents = fs.readFileSync(path.join(__dirname,'plisttemplate.xml')).toString();

    // Replace values with the new bundle name and XCode environment variables.
    plistXmlContents = plistXmlContents
      .replace(/\{ENV_MAC_OS_X_PRODUCT_BUILD_VERSION\}/g, process.env.MAC_OS_X_PRODUCT_BUILD_VERSION)
      .replace(/\{VAR_BINARY_NAME\}/g, currentFramework.newFrameworkName)
      .replace(/\{ENV_DEFAULT_COMPILER\}/g, process.env.DEFAULT_COMPILER)
      .replace(/\{ENV_PLATFORM_PRODUCT_BUILD_VERSION\}/g, process.env.PLATFORM_PRODUCT_BUILD_VERSION)
      .replace(/\{ENV_SDK_VERSION\}/g, process.env.SDK_VERSION)
      .replace(/\{ENV_SDK_PRODUCT_BUILD_VERSION\}/g, process.env.SDK_PRODUCT_BUILD_VERSION)
      .replace(/\{ENV_SDK_NAME\}/g, process.env.SDK_NAME)
      .replace(/\{ENV_XCODE_VERSION_ACTUAL\}/g, process.env.XCODE_VERSION_ACTUAL)
      .replace(/\{ENV_XCODE_PRODUCT_BUILD_VERSION\}/g, process.env.XCODE_PRODUCT_BUILD_VERSION);

    // Use plutil to generate the plist in the binary format.
    let plistGeneration = spawnSync('plutil',[
      '-convert',
      'binary1', // Will convert the xml plist to binary.
      '-o',
      path.join(currentFramework.newFrameworkFileName,'Info.plist'), // target Info.plist path.
      '-' // read the input from the process stdin.
    ], {
      input: plistXmlContents
    });
  }

  var frameworkOverrideContents = []
  for (let i = 0; i < foundFrameworks.length; i++) {
    // Generate the contents of a JSON file for overriding dlopen calls at runtime.
    let currentFramework = foundFrameworks[i];
    frameworkOverrideContents.push(
      {
        originalpath: currentFramework.originalRelativePath.split(path.sep),
        newpath: ['..', 'Frameworks', currentFramework.newFrameworkName+'.framework', currentFramework.newFrameworkName]
      }
    );
  }
  fs.writeFileSync(path.join(projectPath, 'override-dlopen-paths-data.json'), JSON.stringify(frameworkOverrideContents));

  // Copy runtime script that will override dlopen paths.
  fs.copyFileSync(path.join(__dirname,'override-dlopen-paths-preload.js'),path.join(projectPath,'override-dlopen-paths-preload.js'));

  for (let i = 0; i < foundFrameworks.length; i++) {
    // Put an empty file in each of the .node original locations, since some modules check their existence.
    fs.closeSync(fs.openSync(foundFrameworks[i].originalFileName, 'w'));
  }

}


if (process.argv.length >=3) {
  if (fs.existsSync(process.argv[2])) {
    visitEveryFramework(path.normalize(process.argv[2]));
  }
  process.exit(0);
} else {
  console.error("A path is expected as an argument.");
  process.exit(1);
}
