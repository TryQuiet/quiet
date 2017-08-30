var path         = require('path');
var gulp         = require('gulp');
var babel        = require('gulp-babel');
var del          = require('del');
var nodeVersion  = require('node-version');
var childProcess = require('child_process');
var OS           = require('os-family');


var PACKAGE_PARENT_DIR  = path.join(__dirname, '../');
var PACKAGE_SEARCH_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + PACKAGE_PARENT_DIR;


gulp.task('clean', function () {
    return del(['lib', '.screenshots']);
});

gulp.task('lint', function () {
    // TODO: eslint supports node version 4 or higher.
    // Remove this condition once we get rid of node 0.10 support.
    if (nodeVersion.major === '0')
        return null;

    var eslint = require('gulp-eslint');

    return gulp
        .src([
            'src/**/*.js',
            'test/**/*.js',
            'Gulpfile.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('build', ['clean', 'lint'], function () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('test', ['build'], function (cb) {
    var testCafeCmd = path.join(__dirname, 'node_modules/.bin/testcafe');
    var appPath     = path.join(__dirname, 'test/test-app');

    if (OS.win)
        testCafeCmd += '.cmd';

    process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

    var child = childProcess.spawn(testCafeCmd, ['electron:' + appPath, 'test/fixtures/**/*test.js', '-s', '.screenshots'], { stdio: 'inherit' });

    child.on('error', function (error) {
        cb(error);
    });

    child.on('exit', function (code) {
        var error = code ? new Error('Process exited with code ' + code) : null;

        cb(error);
    });
});

