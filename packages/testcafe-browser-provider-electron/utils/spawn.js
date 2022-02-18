var nodeSpawn = require('cross-spawn')
var Promise   = require('pinkie');
var assign    = require('lodash').assign;


module.exports = function (cmd, args, opts) {
    return new Promise(function (resolve, reject) {
        opts = opts || {};

        if (opts.env)
            opts.env = assign({}, process.env, opts.env);

        var spawnOpts = assign({
            stdio: 'inherit',
            shell: true,
        }, opts);

        var childProcess = nodeSpawn(cmd, args, spawnOpts);

        if (opts.wait !== void 0 && !opts.wait) {
            resolve();
            return;
        }

        childProcess.on('exit', function (code) {
            if (code)
                reject(new Error('Process ' + cmd + ' exited with code: ' + code));
            else
                resolve();
        });
    });
};
