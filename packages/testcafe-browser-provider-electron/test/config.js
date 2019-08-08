var path = require('path');


module.exports = {
    testPage: 'file://' + path.join(__dirname, process.env.ASAR_MODE ? 'data/test-app.asar/index.html' : 'data/test-app-regular/index.html')
};
