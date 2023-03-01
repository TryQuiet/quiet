var fs = require('fs');
var path = require('path');

var substitutionDataFile = path.join(__dirname,'override-dlopen-paths-data.json');
// If the json file exists, override dlopen to load the specified framework paths instead.
if (fs.existsSync(substitutionDataFile)) {
  var pathSubstitutionData = JSON.parse(fs.readFileSync(substitutionDataFile, 'utf8'));

  var pathSubstitutionDictionary = {};
  // Build a dictionary to convert paths at runtime, taking current sandboxed paths into account.
  for (let i = 0; i < pathSubstitutionData.length; i++) {
    pathSubstitutionDictionary[
      path.normalize(path.join.apply(null, [__dirname].concat(pathSubstitutionData[i].originalpath)))
    ] = path.normalize(path.join.apply(null, [__dirname].concat(pathSubstitutionData[i].newpath)));
  }

  var old_dlopen = process.dlopen;
  // Override process.dlopen
  process.dlopen = function(_module, _filename) {
    if( pathSubstitutionDictionary[path.normalize(_filename)] ) {
      _filename = pathSubstitutionDictionary[path.normalize(_filename)];
    }
    old_dlopen(_module,_filename);
  }
}


