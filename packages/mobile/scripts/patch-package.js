const fs = require('fs');
const path = require('path');

// Patches a package.json in case it has variable substitution for
// the module's binary at runtime. Since we are cross-compiling
// for mobile, this substitution will have different values at
// build time and runtime, so we pre-substitute them with fixed
// values.
function patchPackageJSON_preNodeGyp_modulePath(filePath)
{
  let packageReadData = fs.readFileSync(filePath);
  let packageJSON = JSON.parse(packageReadData);
  if ( packageJSON && packageJSON.binary && packageJSON.binary.module_path ) {
    let binaryPathConfiguration = packageJSON.binary.module_path;
    binaryPathConfiguration = binaryPathConfiguration.replace(/\{node_abi\}/g, "node_abi");
    binaryPathConfiguration = binaryPathConfiguration.replace(/\{platform\}/g, "platform");
    binaryPathConfiguration = binaryPathConfiguration.replace(/\{arch\}/g, "arch");
    binaryPathConfiguration = binaryPathConfiguration.replace(/\{target_arch\}/g, "target_arch");
    binaryPathConfiguration = binaryPathConfiguration.replace(/\{libc\}/g, "libc");
    packageJSON.binary.module_path = binaryPathConfiguration;
    let packageWriteData = JSON.stringify(packageJSON, null, 2);
    fs.writeFileSync(filePath, packageWriteData);
  }
}

// Visits every package.json to apply patches.
function visitPackageJSON(folderPath)
{
  let files = fs.readdirSync(folderPath);
  for (var i in files) {
    let name = files[i];
    let filePath = path.join(folderPath, files[i]);
    if (fs.lstatSync(filePath).isDirectory()) {
      visitPackageJSON(filePath);
    } else {
      if (name === 'package.json') {
        try {
          patchPackageJSON_preNodeGyp_modulePath(filePath);
        } catch (e) {
          console.warn(
            'Failed to patch the file : "' +
            filePath +
            '". The following error was thrown: ' +
            JSON.stringify(e)
          );
        }
      }
    }
  }
}

if (process.argv.length >=3)
{
  if (fs.existsSync(process.argv[2])) {
    visitPackageJSON(process.argv[2]);
  }
  process.exit(0);
} else {
  console.error("A path is expected as an argument.");
  process.exit(1);
}
