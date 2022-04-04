const fs = require('fs');
exports.default = async function(context) {

fs.readdir(context.outDir, (err, files) => {
  files.forEach(file => {
    console.log(file);
  });
});
    console.log(context.outDir);
    console.log('beforeeeeeeeeeeeeeeeeeeeeeeeeeeee packkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk')
}