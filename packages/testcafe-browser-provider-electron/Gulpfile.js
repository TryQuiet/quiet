var path         = require('path');
var gulp         = require('gulp');
var babel        = require('gulp-babel');
var eslint       = require('gulp-eslint');
var del          = require('del');
var childProcess = require('child_process');
var OS           = require('os-family');


var PACKAGE_PARENT_DIR  = path.join(__dirname, '../');
var PACKAGE_SEARCH_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + PACKAGE_PARENT_DIR;

function clean () {
    return del(['lib', '.screenshots']);
}

function lint () {
    return gulp
        .src([
            'src/**/*.js',
            'test/**/*.js',
            'Gulpfile.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function build () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
} 

function test () {
    var testCafeCmd = path.join(__dirname, 'node_modules/.bin/testcafe');
    var appPath     = path.join(__dirname, 'test/test-app');

    if (OS.win)
        testCafeCmd += '.cmd';

    process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

    return childProcess.spawn(testCafeCmd, ['electron:' + appPath, 'test/fixtures/**/*test.js', '-s', '.screenshots'], { stdio: 'inherit' });
}

exports.lint  = lint;
exports.build = gulp.parallel(lint, gulp.series(clean, build));
exports.test  = gulp.series(exports.build, test); 
